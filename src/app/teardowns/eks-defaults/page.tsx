import type { Metadata } from "next";

/**
 * Public teardown #3 — Kubernetes/EKS. Subject: the DOCUMENTED defaults of a
 * fresh EKS cluster + stock Kubernetes semantics every team inherits — never any
 * team's private prod. Endpoint/logging/CNI claims verified against the AWS EKS
 * user guide (linked per finding) on 2026-07-02; the rest are stable Kubernetes
 * semantics sourced to kubernetes.io. Figures labelled typical.
 */

const CANON = "https://audits.zephyrcode.live/teardowns/eks-defaults";

export const metadata: Metadata = {
  title: "The EKS cluster you inherited — a ZephyrCode teardown",
  description:
    "A fresh EKS cluster ships with a public API endpoint, no control-plane logs, no autoscaling, and workloads that run as eviction fodder. Eight defaults, each with the mechanism and the fix — sourced against the AWS docs.",
  alternates: { canonical: CANON },
  robots: { index: true, follow: true },
  openGraph: {
    type: "article",
    url: CANON,
    siteName: "ZephyrCode — Engineering Audits",
    title: "The EKS cluster you inherited",
    description:
      "Eight production-hostile defaults in the EKS cluster everyone inherits — public endpoint, silent control plane, IP exhaustion, eviction roulette — with the mechanism and the fix.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The EKS cluster you inherited",
    description:
      "Eight production-hostile EKS/Kubernetes defaults — the mechanism, the fix, every claim sourced.",
  },
};

type Finding = {
  n: number;
  sev: "High" | "Medium";
  title: string;
  who: string;
  body: string;
  code: string;
  fix: string;
  trade: string;
  before: string;
  after: string;
  source: { label: string; href: string }[];
};

const FINDINGS: Finding[] = [
  {
    n: 1,
    sev: "High",
    title: "The API server is on the internet",
    who: "Pages security, eventually — and until then, nobody.",
    body: "AWS’s own docs say it plainly: “By default, this API server endpoint is public to the internet.” Access is still authenticated — IAM plus RBAC — but the front door of your cluster’s control plane answers to the whole internet, which means credential mistakes, token leaks, and future auth CVEs are internet-exploitable instead of VPC-exploitable. Most teams never revisit it, because the cluster worked on day one and the endpoint setting lives in a console tab nobody opens twice.",
    code: `<span class="c"># a fresh cluster's endpoint access</span>
<span class="flag">endpointPublicAccess  = <span class="e">true</span><span class="datum">◂ the control plane answers the internet</span></span>
endpointPrivateAccess = <span class="e">false</span>
publicAccessCidrs     = <span class="e">0.0.0.0/0</span></span>`,
    fix: "Enable the private endpoint; then either restrict publicAccessCidrs to your offices/VPN or disable public access outright. Do it early — the change is disruptive to bolt on after tooling has assumed a public endpoint.",
    trade: "Private-only access needs a path into the VPC (VPN, transit gateway, bastion, or CloudShell) — and your CI’s kubectl needs that path too.",
    before: "Control-plane auth surface exposed to the internet",
    after: "API server reachable only from networks you enumerate",
    source: [
      { label: "EKS: cluster endpoint", href: "https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html" },
    ],
  },
  {
    n: 2,
    sev: "High",
    title: "The control plane is silent",
    who: "Pages whoever runs the incident where “who deleted that?” has no answer.",
    body: "“By default, cluster control plane logs aren’t sent to CloudWatch Logs.” All five log types — api, audit, authenticator, controllerManager, scheduler — ship turned off. That means no audit trail of who did what to the cluster, no authenticator record of which IAM identity became which Kubernetes user, and no API-server logs when you’re debugging a webhook that’s rejecting everything. The first time most teams enable audit logging is the day they need last month’s audit log, which is exactly the day it doesn’t exist.",
    code: `<span class="c"># a fresh cluster's logging config</span>
<span class="flag">clusterLogging: api            = <span class="e">off</span><span class="datum">◂ all five types ship OFF</span></span>
<span class="flag">clusterLogging: audit          = <span class="e">off</span><span class="datum">◂ "who deleted it?" — no record</span></span>
clusterLogging: authenticator  = <span class="e">off</span>
clusterLogging: controllerManager = <span class="e">off</span>
clusterLogging: scheduler      = <span class="e">off</span></span>`,
    fix: "Enable at least audit + authenticator (compliance and forensics) and api (debugging) on every non-toy cluster, with a CloudWatch retention policy so cost stays bounded.",
    trade: "CloudWatch ingestion and storage costs — real on chatty clusters, which is why you set retention instead of leaving logs off.",
    before: "No audit trail; incident forensics start from nothing",
    after: "Every control-plane action attributable, with bounded retention cost",
    source: [
      { label: "EKS: control plane logs", href: "https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html" },
    ],
  },
  {
    n: 3,
    sev: "High",
    title: "Your workloads are eviction fodder",
    who: "Pages the team whose service dies whenever a neighbour gets busy.",
    body: "Kubernetes doesn’t require resource requests or limits, so the deployment everyone copies ships without them — and every such pod runs in the BestEffort QoS class. Two consequences, both silent. The scheduler packs blind: with no requests, it can’t know a node is full, so it stacks heavy pods together and lets them fight. And under node memory pressure, BestEffort pods are the first the kubelet evicts — your production service is, by definition, the sacrifice the system makes to save itself. The cluster looks fine until the day one noisy neighbour makes it look haunted.",
    code: `<span class="c"># the deployment everyone copies</span>
containers:
  - name: api
<span class="flag">    resources: {}<span class="datum">◂ BestEffort — first against the wall</span></span></span>`,
    fix: "Set memory and CPU requests on everything (that’s what the scheduler plans with); set memory limits deliberately; add a LimitRange per namespace so unset pods get defaults instead of BestEffort.",
    trade: "Right-sizing takes measurement — requests too high waste nodes, too low recreate the problem. Start from observed usage, not guesses.",
    before: "Typical: blind packing + noisy neighbours; BestEffort pods evicted first under pressure",
    after: "Scheduler places by declared need; eviction order matches your priorities",
    source: [
      { label: "K8s: pod QoS classes", href: "https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/" },
      { label: "K8s: node-pressure eviction", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/" },
    ],
  },
  {
    n: 4,
    sev: "High",
    title: "The subnet runs out before the node does",
    who: "Pages whoever gets the “pods stuck in ContainerCreating” ticket on a half-empty node.",
    body: "The VPC CNI’s default mode assigns every pod its own secondary IP address from your subnet, one at a time. Two failure shapes ship with that default. In small subnets — the /24s everyone carves — the subnet exhausts long before the nodes do: CPU sits free while pods hang in ContainerCreating because there is literally no IP to give them. And per AWS’s own docs, the default mode “must make more Amazon EC2 API calls to configure network interfaces and IP addresses,” so exactly when a spiky workload scales, pod launches slow down behind EC2 API throttling. Prefix delegation — the fix — exists, is documented, and is off until you turn it on.",
    code: `<span class="c"># amazon-vpc-cni defaults</span>
<span class="flag">ENABLE_PREFIX_DELEGATION = <span class="e">false</span><span class="datum">◂ one EC2 IP per pod, one at a time</span></span>
WARM_ENI_TARGET          = <span class="e">1</span></span>`,
    fix: "Enable prefix delegation (per AWS guidance, on new node groups rather than rolling existing ones) and size subnets for pod density, not just node count.",
    trade: "Prefix mode allocates /28 blocks — coarser IP consumption per node — and once nodes run prefixes you can’t downgrade the CNI below 1.9.0 without replacing node groups.",
    before: "Typical: half-empty nodes, exhausted subnet, pods pending on IPs; slow scale-out under EC2 API throttling",
    after: "Pod density bounded by compute, not by /24 arithmetic; fastest documented launch path",
    source: [
      { label: "EKS: prefix delegation", href: "https://docs.aws.amazon.com/eks/latest/userguide/cni-increase-ip-addresses.html" },
      { label: "EKS best practices: prefix mode", href: "https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html" },
    ],
  },
  {
    n: 5,
    sev: "Medium",
    title: "Routine maintenance takes your service down",
    who: "Pages the on-call during a “non-disruptive” node group upgrade.",
    body: "Kubernetes ships no PodDisruptionBudgets — they’re opt-in, per workload, and the tutorials skip them. Without one, a voluntary disruption (node drain, managed node-group upgrade, Karpenter consolidation) is allowed to evict every replica of your service at once; three replicas on two draining nodes is an outage the platform considers polite. The cruel part: everything is working as designed, every eviction was “graceful,” and the postmortem finds no failure — just an upgrade that walked through your quorum.",
    code: `<span class="c"># what protects your 3-replica service during a drain</span>
<span class="flag">PodDisruptionBudget: <span class="e">none</span><span class="datum">◂ all replicas evictable simultaneously</span></span></span>`,
    fix: "A PDB for every multi-replica service (maxUnavailable: 1 is a sane start), paired with topology spread so replicas don’t share a node/AZ to begin with.",
    trade: "Over-strict PDBs (maxUnavailable: 0) wedge node drains and block upgrades — the budget must permit some disruption or operations stop.",
    before: "Node upgrades may evict entire services at once",
    after: "Drains proceed one replica at a time; upgrades stop being outages",
    source: [
      { label: "K8s: disruptions & PDBs", href: "https://kubernetes.io/docs/concepts/workloads/pods/disruptions/" },
    ],
  },
  {
    n: 6,
    sev: "Medium",
    title: "Elastic in the brochure, fixed in the cluster",
    who: "Pages capacity-planning-by-incident: the Friday traffic doubles.",
    body: "A fresh EKS cluster includes no metrics-server, no HorizontalPodAutoscaler targets that can work without it, and no node autoscaler — neither Cluster Autoscaler nor Karpenter comes installed. So the “elastic” cluster everyone inherited is a fixed pool of nodes wearing a Kubernetes costume: HPA objects (if anyone created them) sit broken for lack of metrics, and when load exceeds the node group, pods pend until a human buys capacity. Teams discover this precisely once.",
    code: `<span class="c"># what a fresh cluster ships for scaling</span>
<span class="flag">metrics-server        = <span class="e">not installed</span><span class="datum">◂ HPA has no signal</span></span>
<span class="flag">node autoscaler       = <span class="e">not installed</span><span class="datum">◂ pods pend; nobody buys nodes</span></span></span>`,
    fix: "Install metrics-server; give every scalable service an HPA with sane bounds; run Karpenter (or Cluster Autoscaler) so pending pods buy capacity instead of paging humans.",
    trade: "Autoscalers are operational surface — bad requests (Finding 3) make them scale wrong, which is why requests come first.",
    before: "Fixed capacity; load spikes end in pending pods and a human",
    after: "Pod and node capacity follow demand inside declared bounds",
    source: [
      { label: "EKS: metrics server", href: "https://docs.aws.amazon.com/eks/latest/userguide/metrics-server.html" },
      { label: "EKS: autoscaling", href: "https://docs.aws.amazon.com/eks/latest/userguide/autoscaling.html" },
    ],
  },
  {
    n: 7,
    sev: "Medium",
    title: "Every pod can call every pod",
    who: "Pages security during the audit, and incident response after the breach.",
    body: "Kubernetes networking is default-allow: with no NetworkPolicies, any pod can reach any pod in any namespace — the payments service answers connections from the marketing microsite’s sidecar. Nothing enforces the architecture diagram’s neat arrows; they’re documentation, not policy. One compromised pod is a flat east-west network away from everything else you run, and the cluster you inherited almost certainly has zero policies, because zero is what ships.",
    code: `<span class="c"># east-west traffic control, out of the box</span>
<span class="flag">NetworkPolicy objects = <span class="e">0</span><span class="datum">◂ default-allow, cluster-wide</span></span></span>`,
    fix: "Enable network-policy enforcement (the VPC CNI supports Kubernetes NetworkPolicies), apply a default-deny per namespace, then allow the flows the architecture actually requires.",
    trade: "Policy authoring is real work and a wrong deny is an outage — roll out namespace by namespace with observability on denied flows.",
    before: "Flat network: one compromised pod reaches everything",
    after: "East-west traffic matches the architecture diagram, enforced",
    source: [
      { label: "K8s: network policies", href: "https://kubernetes.io/docs/concepts/services-networking/network-policies/" },
      { label: "EKS: network policies", href: "https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html" },
    ],
  },
  {
    n: 8,
    sev: "Medium",
    title: "The volume that pins the pod",
    who: "Pages the team whose stateful pod won’t reschedule after a node dies.",
    body: "EBS volumes are zonal, and a pod bound to an EBS-backed PersistentVolume can only ever run in that volume’s availability zone. Lose the node — or just the AZ’s spare capacity — and the pod sits Pending with “volume node affinity conflict” while its data waits in an AZ that can’t host it. Multi-AZ node groups make this worse, not better: the scheduler happily created the volume wherever the first pod landed, and that accident is now a permanent placement constraint.",
    code: `<span class="c"># the constraint nobody declared</span>
<span class="flag">EBS volume zone = <span class="e">us-east-1a</span><span class="datum">◂ the pod is now zonal, forever</span></span>
volumeBindingMode: <span class="e">WaitForFirstConsumer</span>   <span class="c"># use this — binds where the pod schedules</span></span>`,
    fix: "StorageClasses with volumeBindingMode: WaitForFirstConsumer (so volumes bind where pods actually schedule), per-AZ capacity headroom for stateful workloads, and EFS/replication for data that genuinely must survive an AZ.",
    trade: "True multi-AZ statefulness costs — EFS latency or application-level replication. The cheap alternative is accepting zonal blast radius consciously.",
    before: "Node/AZ loss strands stateful pods on “volume node affinity conflict”",
    after: "Volumes bind to schedulable zones; AZ risk is a decision, not a surprise",
    source: [
      { label: "K8s: storage classes / binding mode", href: "https://kubernetes.io/docs/concepts/storage/storage-classes/" },
      { label: "EBS CSI driver", href: "https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html" },
    ],
  },
];

const CSS = `
.td-page{--ink:#0A0C0F;--ink-1:#10141A;--ink-2:#171C24;--paper:#EEF2F6;--dim:#AEB8C4;--faint:#8593A2;--signal:#3DE1E6;--signal-deep:#1FB6C9;--alert:#FF5D6E;--alert-soft:rgba(255,93,110,.1);--ok:#5CE0A8;--line:#1B222B;--line-2:#27303B;--serif:"Spectral",Georgia,"Times New Roman",serif;--mono:"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace;background:var(--ink);color:var(--paper);min-height:100vh;font-family:var(--serif);-webkit-font-smoothing:antialiased}
.td-page *{box-sizing:border-box}
.td-page a{color:var(--signal);text-decoration:none}
.td-page a:hover{text-decoration:underline}
.td-wrap{max-width:820px;margin:0 auto;padding:64px 24px 96px}
.td-eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--signal);display:flex;align-items:center;gap:10px}
.td-eyebrow::before{content:"";width:22px;height:1px;background:var(--signal)}
.td-h1{font-weight:500;font-size:clamp(2rem,5vw,3.1rem);line-height:1.1;letter-spacing:-.015em;margin:20px 0 0}
.td-h1 em{font-style:italic;color:var(--signal)}
.td-dek{color:var(--dim);font-size:1.12rem;line-height:1.6;margin-top:20px;max-width:60ch}
.td-byline{font-family:var(--mono);font-size:.8rem;color:var(--faint);margin-top:26px;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline;padding-top:22px;border-top:1px solid var(--line)}
.td-byline b{color:var(--paper);font-weight:500}
.td-note{margin:34px 0 8px;padding:20px 22px;border:1px solid var(--line-2);border-left:2px solid var(--signal-deep);border-radius:0 8px 8px 0;background:var(--ink-1)}
.td-note .lab{font-family:var(--mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--signal);margin-bottom:10px}
.td-note p{color:var(--dim);font-size:.96rem;line-height:1.62;margin:0 0 10px}
.td-note p:last-child{margin-bottom:0}
.td-note b{color:var(--paper);font-weight:500}
.td-count{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin:56px 0 18px;display:flex;align-items:center;gap:10px}
.td-count::after{content:"";flex:1;height:1px;background:var(--line)}
.finding{border:1px solid var(--line-2);border-radius:12px;background:var(--ink-1);overflow:hidden;margin-bottom:26px}
.f-head{display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid var(--line);background:var(--ink-2);flex-wrap:wrap}
.sev{font-family:var(--mono);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;padding:4px 10px;border-radius:3px}
.sev.high{background:var(--alert-soft);color:var(--alert);border:1px solid rgba(255,93,110,.4)}
.sev.medium{background:rgba(61,225,230,.08);color:var(--signal);border:1px solid rgba(61,225,230,.3)}
.f-id{font-family:var(--mono);font-size:.68rem;color:var(--faint);letter-spacing:.08em}
.f-title{font-weight:500;font-size:1.5rem;letter-spacing:-.01em;width:100%;line-height:1.2}
.f-body{padding:24px 26px}
.f-who{font-family:var(--mono);font-size:.76rem;color:var(--signal);margin-bottom:16px;opacity:.9}
.f-body>p{color:var(--dim);font-size:1.02rem;line-height:1.66;margin:0 0 20px}
.codeblk{background:var(--ink);border:1px solid var(--line);border-radius:7px;padding:16px 18px;font-family:var(--mono);font-size:.8rem;line-height:1.85;color:var(--dim);overflow-x:auto;white-space:pre;font-variant-numeric:tabular-nums}
.codeblk .c{color:var(--faint)}
.codeblk .e{color:var(--alert)}
.codeblk .flag{display:block;background:var(--alert-soft);box-shadow:inset 2px 0 0 var(--alert);margin:0 -18px;padding:0 18px}
.codeblk .datum{float:right;color:var(--signal);letter-spacing:.04em}
.impact{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
.metric{padding:14px 16px;border:1px solid var(--line);border-radius:8px;background:var(--ink-2)}
.metric .k{font-family:var(--mono);font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.metric .v{font-size:.98rem;margin-top:7px;line-height:1.4}
.metric.before .v{color:var(--alert)}
.metric.after .v{color:var(--ok)}
.fix{margin-top:18px;padding:16px 20px;border-left:2px solid var(--signal);background:var(--ink-2);border-radius:0 7px 7px 0}
.fix .lab{font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;color:var(--signal);text-transform:uppercase}
.fix p{margin:8px 0 0;color:var(--paper);font-size:.98rem;line-height:1.55}
.fix .trade{color:var(--faint);font-size:.9rem;margin-top:8px}
.f-src{font-family:var(--mono);font-size:.72rem;color:var(--faint);margin-top:18px;display:flex;flex-wrap:wrap;gap:6px 14px}
.td-cta{margin-top:64px;padding:34px 30px;border:1px solid var(--line-2);border-radius:14px;background:linear-gradient(160deg,var(--ink-2),var(--ink-1));text-align:center}
.td-cta h2{font-weight:500;font-size:1.7rem;letter-spacing:-.01em}
.td-cta p{color:var(--dim);font-size:1.02rem;line-height:1.6;margin:12px auto 24px;max-width:52ch}
.td-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.td-btn{font-family:var(--mono);font-size:.85rem;padding:13px 22px;border-radius:5px;letter-spacing:.02em}
.td-btn.primary{background:var(--signal);color:#04181b;font-weight:600}
.td-btn.ghost{border:1px solid var(--line-2);color:var(--paper)}
.td-foot{text-align:center;font-family:var(--mono);font-size:.72rem;color:var(--faint);margin-top:48px}
@media(max-width:560px){.impact{grid-template-columns:1fr}}
`;

export default function EksTeardown() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "The EKS cluster you inherited — a teardown of the defaults everyone ships",
    description: metadata.description,
    url: CANON,
    author: {
      "@type": "Person",
      name: "Priyanshu Sekhar Patra",
      sameAs: ["https://www.linkedin.com/in/pspatra/", "https://github.com/priyanshu-sekhar"],
    },
    publisher: { "@type": "Organization", name: "ZephyrCode", url: "https://zephyrcode.live" },
    about: "Amazon EKS and Kubernetes production configuration",
  };

  return (
    <div className="td-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="td-wrap">
        <div className="td-eyebrow">ZephyrCode teardown · kubernetes · No. 03</div>
        <h1 className="td-h1">
          The EKS cluster you inherited runs <em>on defaults.</em>
        </h1>
        <p className="td-dek">
          A fresh EKS cluster answers the internet, logs nothing, scales nothing, and treats your workloads as eviction
          fodder — all by documented default. Here are eight, each with the exact setting, the mechanism, and the fix.
          This is the format a fixed-price ZephyrCode audit produces, run against the stock configuration instead of
          your system.
        </p>
        <div className="td-byline">
          <b>Priyanshu Sekhar Patra</b>
          <span>ex-Amazon Alexa · distributed systems</span>
          <a href="https://www.linkedin.com/in/pspatra/" target="_blank" rel="noopener">LinkedIn ↗</a>
          <a href="https://github.com/priyanshu-sekhar" target="_blank" rel="noopener">GitHub ↗</a>
        </div>

        <div className="td-note">
          <div className="lab">What this is (and isn’t)</div>
          <p>
            Every claim below is about the <b>documented defaults</b> of a fresh Amazon EKS cluster and stock Kubernetes
            semantics — sourced to the AWS EKS user guide and kubernetes.io at each finding, verified July 2026 —{" "}
            <b>not</b> any team’s private production system. Before/after figures are labelled <b>typical</b>:
            representative of the failure class, not any client’s numbers. If your platform team built a golden path,
            some of these are already fixed — this teardown is the checklist for finding out which.
          </p>
          <p>
            Three things this teardown deliberately does <em>not</em> claim: <b>(1)</b> that the public endpoint means
            an <em>open</em> cluster — access is authenticated (IAM + RBAC); the finding is about exposure surface, not
            anonymous access. <b>(2)</b> that EKS is misconfigured out of the box — these defaults optimise for
            first-contact success, and AWS documents every knob; the failure is inheriting them unread. <b>(3)</b> any
            claim about managed add-on versions, which change frequently — everything here is either a stable documented
            default or core Kubernetes semantics.
          </p>
        </div>

        <div className="td-count">8 findings · High → Medium</div>

        {FINDINGS.map((f) => (
          <article className="finding" key={f.n}>
            <div className="f-head">
              <span className={`sev ${f.sev.toLowerCase()}`}>{f.sev} severity</span>
              <span className="f-id">FINDING {String(f.n).padStart(2, "0")} / 08</span>
              <h2 className="f-title">{f.title}</h2>
            </div>
            <div className="f-body">
              <div className="f-who">{f.who}</div>
              <p>{f.body}</p>
              <pre className="codeblk" dangerouslySetInnerHTML={{ __html: f.code }} />
              <div className="impact">
                <div className="metric before">
                  <div className="k">Before · default</div>
                  <div className="v">{f.before}</div>
                </div>
                <div className="metric after">
                  <div className="k">After · fixed</div>
                  <div className="v">{f.after}</div>
                </div>
              </div>
              <div className="fix">
                <div className="lab">Recommended fix</div>
                <p>{f.fix}</p>
                <p className="trade">Tradeoff — {f.trade}</p>
              </div>
              <div className="f-src">
                <span>Sources:</span>
                {f.source.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noopener">
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}

        <div className="td-cta">
          <h2>That’s the stock cluster. Now picture yours.</h2>
          <p>
            This is the exact deliverable format of a ZephyrCode audit — findings with the mechanism, the evidence, and
            the fix, ranked by what pages you. Run against your EKS, your Postgres, your Kafka. Fixed scope, fixed
            price, two weeks. Not sure it’s worth it? Start with the $1,200 48-hour triage.
          </p>
          <div className="td-btns">
            <a className="td-btn primary" href="https://audits.zephyrcode.live/?utm_source=teardown-eks">
              See the audits →
            </a>
            <a className="td-btn ghost" href="https://audits.zephyrcode.live/?utm_source=teardown-eks#triage">
              Start the $1,200 triage
            </a>
          </div>
        </div>

        <div className="td-foot">
          ZephyrCode · engineering audits · the price is on the door · previously:{" "}
          <a href="/teardowns/kafka-defaults">Kafka</a> · <a href="/teardowns/postgres-pools">Postgres</a>
        </div>
      </div>
    </div>
  );
}
