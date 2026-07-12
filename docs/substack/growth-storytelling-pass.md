# The Optimum — Growth & Storytelling Pass

Date: 2026-07-12. Scope: diagnosis, retitles + openers for all 18 scheduled posts, 7 citation notes, 5 orthogonal notes, posting schedule from Jul 17. Everything below the diagnosis is paste-ready.

---

## 1. Diagnosis — what's actually wrong with the storytelling

### What the research says grows small technical Substacks

Cross-referencing Substack growth case studies and algorithm write-ups (the Notes algorithm explainer by its creator, the 2025 algorithm-change post-mortems, "why most Substacks never grow" analyses):

1. **Restacks are the primary distribution signal.** The Notes feed amplifies restacks-with-commentary and replies far more than original broadcast notes, because interactions between writers tell the algorithm which audiences overlap. Writers who restack 1–2 adjacent-audience posts daily report profile views and subscribers from complete strangers; writers who only broadcast their own material report flat lines.
2. **Positioning beats prose.** The most common stall pattern is not bad writing — it's a stranger landing on a post and having no idea within two seconds what the publication is for and whether it's for them. Titles and subtitles do almost all of this work, because titles are the only thing that travels (in the feed, in recommendations, in restacks).
3. **Conviction posts travel; "interesting observations" don't.** "Here's where I stand and why" posts get restacked. Balanced technical explainers get silently appreciated by the six people who already subscribed.
4. **Growth at <100 subs is a discovery problem, not a retention problem.** Template fatigue, cadence, series structure — these matter when a thousand people are deciding whether to keep opening. At ~1 subscriber, nobody has fatigue. Nobody has arrived yet.

### Testing the hypotheses against our list

**H1: Titles are insider-clever and give a stranger no reason to care — CONFIRMED, and it's worse than hypothesized.**
"Greedy is a 76%." "The line under acks=all." "The pool that isn't one." These are *punchlines*, not promises. A punchline title rewards someone who already read the essay; a stranger in the Notes feed sees a private joke. Every strong title in the reference class (Pragmatic Engineer: "Inside Datadog's $5M Outage"; Experimental History: "The Decline of Deviance") contains a stake, a number a stranger understands, or a named entity. Ours contain a number only an insider can price ("76% of *what*?") — the one asset we own (graded distance from the optimum) is being spent as an in-joke instead of a hook. Also structural: several titles bury the finding ("58% off your token bill, from reordering" is close, actually good bones) while others hide it completely ("Context engineering, in production" is a category label, not a claim).

**H2: Every essay is the same template → series fatigue — REFUTED as the current bottleneck, CONFIRMED as a ceiling.**
At 2–14 views the template has never been experienced twice by anyone. The template is actually an asset (it's a *format*, like Money Stuff's). But it becomes a ceiling around a few hundred subscribers, and it has one real cost *today*: it produces no entry-point post. Every essay assumes you already accept the premise that "% of optimum" is a meaningful way to grade systems. There is no post a stranger can be sent to that *sells the premise itself*. That's a missing genre, not a broken template.

**H3: Nothing is time-relevant/newsy — CONFIRMED but ranked low.**
Newsjacking helps discovery, but it's the weakest lever here: our moat is evergreen graded findings, and chasing news trades the moat for a lottery ticket. Cheap fix: peg one essay per month to something currently circulating (a public outage, a pricing change, a viral claim), not a rework of the whole calendar.

**H4: No faces / no beginner on-ramp / everything speaks to people who know what acks=all is — CONFIRMED.**
Confirmed by the ecosystem too: Arena has 41 playable puzzles and 12 interview guides, and the newsletter never once addresses the person *preparing for interviews* — the largest adjacent audience that doesn't yet know what acks=all is but desperately wants to. The publication currently has no post answering "who is this for and why should I trust the grader?"

**H5 (found during research, not hypothesized): The Notes strategy is broadcast-only — CONFIRMED and it is the #1 problem.**
Daily one-liner findings + amplifier notes are *all self-referential*. Zero restacks of others, zero replies, zero recommendations of adjacent writers. Per the algorithm mechanics, this is publishing into a room with no doors. The essays are fine; nobody is being routed to them.

### The top 3 changes, ranked by expected impact

1. **Turn Notes from a megaphone into a conversation.** Restack/quote 1–2 genuinely good posts by adjacent writers per day *with an additive technical observation* (ammo in §3), name the author, and explicitly recommend. This is the single highest-leverage act available at this subscriber count — it's how the algorithm learns whose readers should see us. Expected effect: first non-zero stranger traffic within 2–3 weeks.
2. **Retitle everything scheduled so the title is a promise with a stake, and the subtitle names who it's for and what they get.** Keep the wit; move it to the subtitle or the pull-quote. (Complete pass in §2.) Expected effect: multiplies whatever traffic change #1 generates — right now even a perfect restack lands people on titles that bounce them.
3. **Break the pattern visibly, ~1 post in 4, and build the on-ramp.** Ship (a) the orthogonal-domain notes in §4 — they are the shareable, no-prerequisites face of the brand; (b) one entry-point essay: *"What '76% of optimum' means, and why 'good enough' is a number"* — the post every future reader gets linked to first, pinned, and linked from the About page. Expected effect: gives restackers something a non-engineer can forward, which is what restack chains are made of.

---

## 2. Scheduled posts — titles, subtitles, openers

Slugs unchanged. "KEEP" means the existing title already does the job. Subtitles are written to be pasted into Substack's subtitle field. Openers replace the first paragraph where the current cold-open assumes insider context; each is written to stand alone before the existing "the setup" section.

### Summary table

| Date | Current title | New title | New subtitle |
|---|---|---|---|
| Jul 16 | The pool that isn't one | Two hundred clients, twenty chairs | The Postgres "pool" setting everyone copies isn't a pool at all — and it's why your app falls over while the database sits at 4% CPU. |
| Jul 21 | The 72% tax on calling the big model once | The most expensive line of code in your app is one line long | Calling the frontier model on every request feels safe. Graded against the optimum, it's a 72% tax. Here's the receipt. |
| Jul 23 | The Redis-only trap | Redis is a great cache and a terrible memory | How a cache quietly becomes your database, what it costs you the day it restarts, and the boring architecture that beats it. |
| Jul 28 | 58% off your token bill, from reordering | We cut a token bill 58% without deleting a word | Same prompts, same model, same answers. The only thing that changed was the order. Prompt caching is a sorting problem. |
| Aug 4 | Bigger chunks lose | We made the chunks smaller and the answers got smarter | Everyone sizes RAG chunks by vibes. We graded every size against the optimum — the winner embarrasses the default. |
| Aug 6 | Context engineering, in production | The context window is a budget, and you're overspending it | What "context engineering" actually means once real users are on the other end — and the three line items that eat the whole budget. |
| Aug 11 | What your agent forgets, and why | Your agent has amnesia, and you didn't choose what it forgets | Every agent forgets — the only question is whether you designed the forgetting or the truncation code did. |
| Aug 13 | The cluster you inherited | Nobody remembers why the cluster is set up like this | A field guide to the EKS defaults someone else chose: what each one silently costs, and the order to fix them in. |
| Aug 18 | Your eval set is lying to you | KEEP: Your eval set is lying to you | Forty hand-picked examples said ship it. Production said otherwise. How the gap opens, and the cheapest way to close it. |
| Aug 20 | You can't improve what you can't see | The AI feature was wrong for three weeks and no dashboard noticed | LLM observability isn't a latency panel. It's knowing which answers were bad — here's the minimum system that knows. |
| Aug 25 | Retrieval problem or generation problem? | Wrong answer. Now: blame the librarian or the writer? | Half of RAG debugging is fixing the innocent half. One cheap test tells you which half is guilty — run it before the week-long fine-tune. |
| Sep 1 | The specialist tax | When a team of cheap specialists loses to one generalist | Specialist models look free until you price the router, the failovers, and the upkeep. The break-even is sharper than you think. |
| Sep 3 | Human-in-the-loop without killing throughput | The human in the loop is the slowest API you call | Review queues, sampling, escalation: keeping people in the loop at machine speed — including the math for how many reviewers you actually need. |
| Sep 8 | Safety has a latency bill | Every guardrail slows the answer down. Here's the itemized bill. | Moderation, groundedness checks, PII scrubbing — each one costs milliseconds and money. What's worth it, what isn't, and the order that minimizes both. |
| Sep 15 | Cheap and flaky beats expensive and reliable | KEEP: Cheap and flaky beats expensive and reliable | A 90%-reliable model with retries beats the 99% one at a third of the price. The arithmetic nobody runs before choosing a model. |
| Sep 17 | The learning loop that haunts every AI team | Everyone pitches the flywheel. Almost nobody has one. | "Our product improves with every interaction" is the most-claimed, least-built system in AI. Where the loop breaks, and the one place it actually closes. |
| Sep 22 | Everyone's favourite is the same favourite | Ask five AI judges, get one opinion | LLM judges agree with each other suspiciously often — including when they're all wrong. What that does to your leaderboard, and to everyone's model choice. |
| Oct 1 | One agent or many? | One agent or many? We priced both. | Multi-agent looks like an architecture decision. It's a bill — the break-even in tokens, latency, and new ways to fail. |

### Per-post blocks

---

**Jul 16 — slug unchanged**
**Title:** Two hundred clients, twenty chairs
**Subtitle:** The Postgres "pool" setting everyone copies isn't a pool at all — and it's why your app falls over while the database sits at 4% CPU.
**Replacement opener:**
Every Postgres outage story I've been paid to look at starts the same way: traffic doubled, the app stopped answering, and the database — the thing everyone was yelling at — was idling at 4% CPU. Nothing was broken. Everything was *waiting*. Two hundred clients had shown up to a room with twenty chairs, and the config file swore, in writing, that the room was a pool.

---

**Jul 21 — slug unchanged**
**Title:** The most expensive line of code in your app is one line long
**Subtitle:** Calling the frontier model on every request feels safe. Graded against the optimum, it's a 72% tax. Here's the receipt.
**Replacement opener:**
There is a line of code in almost every AI product that costs more than the engineers who wrote it. It's usually one line. It calls the biggest model in the catalog, for everything — password-reset intents and PhD-level reasoning alike — because the biggest model is the one that never embarrasses you in a demo. This essay is the receipt for what that line actually costs, priced against the cheapest system that gets the same answers right.

---

**Jul 23 — slug unchanged**
**Title:** Redis is a great cache and a terrible memory
**Subtitle:** How a cache quietly becomes your database, what it costs you the day it restarts, and the boring architecture that beats it.
**Replacement opener:**
Nobody decides to use a cache as their database. It happens the way most architecture happens: someone stores one "temporary" thing in Redis because it's Tuesday and Redis is *right there*, and eighteen months later the company's source of truth is a data store whose defining feature is that it's allowed to forget things. Then one day it does.

---

**Jul 28 — slug unchanged**
**Title:** We cut a token bill 58% without deleting a word
**Subtitle:** Same prompts, same model, same answers. The only thing that changed was the order. Prompt caching is a sorting problem.
**Replacement opener:**
Here's a magic trick with an invoice attached. Take an LLM bill. Don't shorten a single prompt, don't downgrade the model, don't drop a single request. Reorder the parts of the prompt — stable stuff first, changing stuff last — and watch 58% of the bill disappear. It's not magic, it's caching, and the reason it works is the reason most teams are accidentally paying full price to re-send the same ten thousand tokens forty times a minute.

---

**Aug 4 — slug unchanged**
**Title:** We made the chunks smaller and the answers got smarter
**Subtitle:** Everyone sizes RAG chunks by vibes. We graded every size against the optimum — the winner embarrasses the default.
**Replacement opener:**
When you build a system that answers questions from your documents, you have to cut the documents into pieces first — the model can only search and read so much at once. Almost everyone cuts big pieces, on the theory that more context means better answers. It's a comfortable theory. We graded it, size by size, against the best the system could possibly do. Big pieces lose, and they lose for a reason that's obvious the moment you watch *what the retriever actually returns*.

---

**Aug 6 — slug unchanged**
**Title:** The context window is a budget, and you're overspending it
**Subtitle:** What "context engineering" actually means once real users are on the other end — and the three line items that eat the whole budget.
**Replacement opener:**
"Context engineering" is the current name for a very old job: deciding what to put in front of a decision-maker who bills by the page. A model's context window looks enormous until production fills it — system rules, tool definitions, retrieved documents, conversation history — and suddenly the one paragraph that mattered is competing with forty that didn't. This is a budgeting problem. Budgets have optima. Here's ours, from a system with real users on the other end.

---

**Aug 11 — slug unchanged**
**Title:** Your agent has amnesia, and you didn't choose what it forgets
**Subtitle:** Every agent forgets — the only question is whether you designed the forgetting or the truncation code did.
**Replacement opener:**
Ask anyone who's shipped an AI agent about their weirdest bug and you'll hear the same story: it did something perfectly, then, twenty steps later, confidently did the opposite — because by then it no longer remembered the first thing. Agents forget. They have to; memory is finite and conversations aren't. The bug isn't the forgetting. The bug is that in most systems, *what* gets forgotten is decided by whichever truncation code shipped first, not by anyone who thought about it.

---

**Aug 13 — slug unchanged**
**Title:** Nobody remembers why the cluster is set up like this
**Subtitle:** A field guide to the EKS defaults someone else chose: what each one silently costs, and the order to fix them in.
**Replacement opener:**
At some point in every infrastructure engineer's life, they are handed a Kubernetes cluster the way you're handed a deceased relative's filing cabinet. The person who configured it is gone. The documentation is a Slack thread that got deleted with the channel. And the cluster *works*, which is the most dangerous part, because "works" is doing an enormous amount of unexamined spending. This is the audit I run on inherited clusters, in the order the money comes back.

---

**Aug 18 — slug unchanged**
**Title:** Your eval set is lying to you *(kept)*
**Subtitle:** Forty hand-picked examples said ship it. Production said otherwise. How the gap opens, and the cheapest way to close it.
**Replacement opener:**
Every AI team has a folder of test questions it uses to decide whether the system is good enough to ship. Ours said 95%. We shipped. Users found the other kind of question within an hour — the kind nobody puts in the folder, because the folder was written by the same people who built the system, testing for the failures they already imagined. Your eval set isn't a measurement. It's a mirror, and it's flattering you.

---

**Aug 20 — slug unchanged**
**Title:** The AI feature was wrong for three weeks and no dashboard noticed
**Subtitle:** LLM observability isn't a latency panel. It's knowing which answers were bad — here's the minimum system that knows.
**Replacement opener:**
The dashboards were green for the entire incident. Latency: fine. Error rate: zero. Uptime: immaculate. The system was returning HTTP 200 and a confident, fluent, *wrong* answer, thousands of times, for three weeks — because every metric we inherited from web services measures whether the answer arrived, and none of them measure whether it was any good. Nothing 500s when the model is wrong. That's the whole problem, and this is the smallest system that solves it.

---

**Aug 25 — slug unchanged**
**Title:** Wrong answer. Now: blame the librarian or the writer?
**Subtitle:** Half of RAG debugging is fixing the innocent half. One cheap test tells you which half is guilty — run it before the week-long fine-tune.
**Replacement opener:**
A question-answering system has exactly two employees: a librarian who fetches the pages, and a writer who reads them and answers. When the answer is wrong, one of them is responsible — and teams routinely spend a week retraining the writer for a crime the librarian committed. There's a test that identifies the guilty party in about an afternoon. Almost nobody runs it, because it's less fun than fine-tuning.

---

**Sep 1 — slug unchanged**
**Title:** When a team of cheap specialists loses to one generalist
**Subtitle:** Specialist models look free until you price the router, the failovers, and the upkeep. The break-even is sharper than you think.
**Replacement opener:**
On paper it's the obvious org chart: a small, cheap model for each job — one for classification, one for extraction, one for chat — instead of one expensive generalist doing everything. Specialists are faster and cost a fraction per call. The paper version leaves out the manager: something has to *route* every request to the right specialist, notice when one fails, and keep seven models' quirks in seven engineers' heads. We priced the whole org chart. The break-even is real, and most teams are on the wrong side of it.

---

**Sep 3 — slug unchanged**
**Title:** The human in the loop is the slowest API you call
**Subtitle:** Review queues, sampling, escalation: keeping people in the loop at machine speed — including the math for how many reviewers you actually need.
**Replacement opener:**
Somewhere in your architecture diagram there's a box with a response time of four business hours. It's labeled "human review," it was added in a meeting where everyone nodded, and it is — by five orders of magnitude — the slowest component you call. Nobody load-tested it. Humans in the loop are a queueing system like any other, which means they have a capacity, a backlog, and an optimum. Here's how to compute all three before the queue computes them for you.

---

**Sep 8 — slug unchanged**
**Title:** Every guardrail slows the answer down. Here's the itemized bill.
**Subtitle:** Moderation, groundedness checks, PII scrubbing — each one costs milliseconds and money. What's worth it, what isn't, and the order that minimizes both.
**Replacement opener:**
Safety reviews and speed reviews happen in different meetings, which is how you end up with a product where every user waits an extra second and a half, on every message, for five checks stacked in the order they were invented rather than the order that makes sense. To be clear about where I stand: most of these checks should exist. But "should exist" is not "should run serially, on everything, first." Each guardrail has a price in milliseconds and dollars. Here is the itemized bill, and the ordering that cuts it without cutting the safety.

---

**Sep 15 — slug unchanged**
**Title:** Cheap and flaky beats expensive and reliable *(kept)*
**Subtitle:** A 90%-reliable model with retries beats the 99% one at a third of the price. The arithmetic nobody runs before choosing a model.
**Replacement opener:**
Here's a claim that sounds wrong: for a huge class of AI workloads, you should choose the model that fails *more often*. Not because failure is good, but because failure you can detect is just a retry — and two calls to a cheap model cost less than one call to an expensive one. The whole argument is four lines of arithmetic. The reason nobody runs it is that "we use the most reliable model" sounds like diligence, and "we use the flaky one, twice if needed" sounds like a confession. The arithmetic doesn't care how it sounds.

---

**Sep 17 — slug unchanged**
**Title:** Everyone pitches the flywheel. Almost nobody has one.
**Subtitle:** "Our product improves with every interaction" is the most-claimed, least-built system in AI. Where the loop breaks, and the one place it actually closes.
**Replacement opener:**
There's a slide in every AI pitch deck — you've seen it — with circular arrows: users generate data, data improves the model, the better model attracts users. The flywheel. I've now been inside enough of these companies to report on the flywheel's condition: the arrows are drawn, the loop is not connected, and the "data" is a bucket of logs nobody has opened. This isn't cynicism, it's a systems observation — the loop breaks at the same joint every time, and the joint is fixable.

---

**Sep 22 — slug unchanged**
**Title:** Ask five AI judges, get one opinion
**Subtitle:** LLM judges agree with each other suspiciously often — including when they're all wrong. What that does to your leaderboard, and to everyone's model choice.
**Replacement opener:**
The AI industry solved the problem of evaluating AI answers by asking an AI, which is either elegant or an Escher drawing depending on the day. Here's the part that should worry you: get five different models to judge the same answers and they agree with each other far more than five humans would — same favourites, same blind spots, same confident mistakes. When all your judges share a taste, you're not measuring quality. You're measuring the taste, and then the whole industry is optimizing toward it in unison.

---

**Oct 1 — slug unchanged**
**Title:** One agent or many? We priced both.
**Subtitle:** Multi-agent looks like an architecture decision. It's a bill — the break-even in tokens, latency, and new ways to fail.
**Replacement opener:**
"Should this be one agent or several?" is the architecture question of the year, and it's usually debated the way architecture questions are: with diagrams, vibes, and whoever read the most recent blog post winning. We did something ruder — we built both and priced them. One agent versus a team of agents, same tasks, measured in tokens spent, seconds elapsed, and (this is the category everyone forgets) brand-new ways to fail that neither system had alone. The invoice settles the debate more decisively than the diagrams did.

---

## 3. Citation notes — engaging other writers (the restack play)

Format per note: paste the body into a new Note, restack-with-quote or attach the URL listed as the card. Post one per slot per the schedule in §5. These deliberately end on our observation, not a link to us — the play is generosity that demonstrates competence.

---

### Note C1 — on The Pragmatic Engineer
**Attach as card:** https://newsletter.pragmaticengineer.com/p/inside-the-datadog-outage
**Author to tag/name:** Gergely Orosz

Gergely Orosz's teardown of Datadog's $5M outage is the best kind of incident writing: specific enough to be uncomfortable. The trigger wasn't exotic — a routine, automatic OS security update rolled across tens of thousands of VMs, in multiple regions, on multiple clouds, at roughly the same time. Every individual machine did exactly what it was configured to do.

Here's the observation I keep coming back to: everyone audits their software for single points of failure, and almost nobody audits their *policies*. "Auto-apply security updates" is a policy, it was identical across every region and cloud, and identical policy is a shared dependency exactly the way a shared database is. The multi-cloud redundancy was real at the infrastructure layer and fictional at the configuration layer.

The fix isn't "don't auto-update" — that trades a fast outage for a slow compromise. It's treating rollout as a scheduling problem with a known optimum: waves sized so that wave N's failure is *detectable* before wave N+1 starts. Detection latency dictates wave size. If you can't state your detection latency, your wave size is "everything," which is what it was here.

If you run infrastructure and don't read The Pragmatic Engineer, fix that today.

---

### Note C2 — on ByteByteGo
**Attach as card:** https://blog.bytebytego.com/p/how-discord-stores-trillions-of-messages
**Author to tag/name:** Alex Xu

Alex Xu's breakdown of how Discord stores trillions of messages is deservedly a classic: 12 Cassandra nodes and billions of messages in 2017, 177 nodes and trillions by 2022, hot partitions melting under celebrity channels, then the migration to ScyllaDB.

But the database swap is the *headline*, not the lesson. The lesson is the Rust data services they put in front of the database — specifically request coalescing. When a thousand users ask for the same hot message at once, the service makes one database query and fans the answer back out. A thousand identical requests become one.

That pattern is criminally underused outside Discord-scale companies. Most "our database is dying" incidents I've graded weren't throughput problems — they were *concurrency duplication* problems, the same query arriving a thousand times in the same hundred milliseconds. Teams respond by buying a bigger database, which is paying rent on work you shouldn't be doing at all. The optimum question isn't "how do we serve this load?" It's "how much of this load is the same request wearing a thousand hats?"

Alex Xu's diagrams have taught more distributed systems than most universities. Recommended without reservation.

---

### Note C3 — on Construction Physics
**Attach as card:** https://www.construction-physics.com/p/how-to-build-an-ai-data-center
**Author to tag/name:** Brian Potter

Brian Potter writes about construction the way I wish more people wrote about software: with numbers where the adjectives usually go. His piece on how to build an AI data center is the best single explainer of the physical machine under the AI boom — power procurement, cooling, and why the building is now designed around the megawatts rather than the other way around.

The detail that rearranged my head: the clocks. A data center building is a decades-scale asset. The GPUs inside it lose their economic edge in a few years. The power interconnection queue can run longer than the useful life of the chips you're queuing for. So every month of construction delay isn't "schedule slip" — it's a direct transfer out of the hardware's most valuable years. Two assets, one project, depreciating at wildly different rates, chained in series.

Software people know this problem intimately; we just call it something else. Whenever a fast-depreciating asset waits on a slow process — a trained model waiting on a compliance review, a feature waiting on a quarterly release train — the queue isn't costing you time, it's costing you the *best* time. Optimize the bottleneck with the fastest-melting payload first.

Subscribe to Construction Physics. It's systems thinking with rebar in it.

---

### Note C4 — on Experimental History
**Attach as card:** https://www.experimental-history.com/p/the-decline-of-deviance
**Author to tag/name:** Adam Mastroianni

Adam Mastroianni's "The Decline of Deviance" argues, with data, that people are getting less weird — fewer pranks, fewer oddballs, fewer strange hobbies pursued in public. A recession of mischief. He's a psychologist, so he explains it psychologically, and it's a wonderful essay.

I want to add the systems version, because we have a name for this failure. It's an exploration–exploitation collapse. Any learning system — a person, a company, a recommendation algorithm — has to split effort between exploiting what's known to work and exploring things that probably won't. Cut exploration to zero and the math is brutal: you converge on a local optimum and then pay for it *forever*, a small compounding tax every step, invisible because the counterfactual never gets sampled. In bandit terms, your regret goes linear.

The eerie part is that we've built an economy of legibility — metrics, ratings, engagement scores — that pays out on exploitation every single time and on exploration almost never. Of course deviance declined. We priced it out. And a society that stops sampling weirdos has no mechanism left for finding the *better* optimum, only for polishing the current one.

Adam Mastroianni is doing some of the most original writing on Substack. Read him.

---

### Note C5 — on Age of Invention
**Attach as card:** https://www.ageofinvention.xyz/p/age-of-invention-how-coal-really
**Author to tag/name:** Anton Howes

The story everyone knows: England switched from wood to coal in the 1500s because the forests ran out. Anton Howes went into the archives and came back with a better story: firewood wasn't critically scarce — the real unlock came from furnace innovations developed where wood genuinely was strained, in the German interior, far from England's coastline of cheap imported timber. New furnace designs separated the smoke from the thing being heated, and once brewers proved coal wouldn't ruin the product, London converted within a generation.

Here's why every engineer should care: coal didn't win on price. It won when someone built the *adapter*. The resource was available for centuries; the switching cost lived entirely in the interface — smoke touching the product — and the moment that interface problem was solved, adoption was nearly instant.

I watch this exact dynamic in database migrations. Teams stay on the "wrong" datastore for years, and the barrier is never the license fee — it's every query, driver, and assumption shaped like the old system. Nobody migrates when the new thing gets cheaper. They migrate when someone ships the compatibility layer. If you want to know what infrastructure wins next, don't watch prices. Watch adapters.

Anton Howes makes the Industrial Revolution read like a thriller with footnotes. Subscribe.

---

### Note C6 — on Works in Progress
**Attach as card:** https://worksinprogress.co/issue/londons-lost-ringways/
**Author to tag/name:** Michael Dnes (in Works in Progress)

Michael Dnes's Works in Progress piece on London's lost Ringways is a history of a monster: 478 miles of motorway that would have carved through the middle of London. The plan died — probably correctly! — but the *way* it died created something permanent: the playbook of organized local veto, and with it a ceiling on British infrastructure ambition that stands fifty years later.

Read it as a distributed-systems paper and it's chilling. A build process where any single node can block a commit is a consensus protocol requiring unanimity — and every systems engineer knows what unanimity buys you: perfect safety against bad writes, and throughput that asymptotically approaches zero as node count grows. Britain didn't decide to stop building things. It chose a quorum rule, node by node, court case by court case, and the throughput collapse followed as a theorem.

The design question for any decision system — database, committee, planning regime — is never "should bad projects be stoppable?" It's "what fraction of nodes must agree, and what does that fraction do to liveness?" Unanimity feels like safety. It's actually an availability guarantee of zero, delivered with paperwork.

Works in Progress publishes several of the best systems essays of any given year. This is one of them.

---

### Note C7 — on Asianometry
**Attach as card:** https://www.asianometry.com/p/the-growing-semiconductor-design
**Author to tag/name:** Jon Y

Jon Y's Asianometry essay on the semiconductor design bottleneck lands on a fact that should be more famous: designing a leading-edge chip is now so complex that *verification* — checking the design, not creating it — dominates the effort. Armies of engineers, most of whom exist to answer one question: are we sure this works before we spend millions taping it out?

Sound familiar? It's the eval problem, in silicon, thirty years ahead of us. Chip designers accepted long ago that exhaustive testing is mathematically dead — you cannot simulate every state of billions of transistors — so they built coverage-driven verification: define the state space that matters, measure which fraction you've exercised, and aim compute at the gaps. Verification became a sampling discipline with an explicit coverage metric.

AI evals today are where chip verification was decades ago: a hand-curated pile of test cases and a prayer. Nobody building LLM systems can tell you their coverage number, because almost nobody has defined the space it's coverage *of*. The hardware people already walked this road — under harsher constraints, since their bugs ship in ceramic and can't be patched on Thursday. We should be stealing their homework shamelessly.

Asianometry is the best writing anywhere on the physical substrate of computing. Subscribe.

---

## 4. Orthogonal-domain notes — the unique footprint

No links in bodies. Numbers verified. Post per schedule in §5.

---

### Note O1 — The dabbawalas

The most reliable delivery network on Earth runs on bicycles, train timetables, and paint.

Every working day, about 5,000 Mumbai dabbawalas move nearly 200,000 home-cooked lunches from kitchens to office desks and the empty boxes back — a system running for over 130 years. Routing information is a short painted code on the lid: origin, station, destination, handler. No GPS, no app, no barcode. Harvard Business School wrote it up as a case study in on-time delivery.

The famous claim is one error per six million deliveries. Here's the honest part, because we do honest parts: that number traces to a 1998 estimate by the association's own president, not an audit. But even off by a couple of orders of magnitude, it embarrasses most courier startups — while pricing at a tiny fraction of app-based delivery.

Why does it work? Constraint, not cleverness. Every route is built around one shared, non-negotiable clock — the Mumbai local train timetable — so the network needs coordination only at handoffs, and the coding scheme carries exactly the bits a handoff needs. Not one bit more.

The optimum isn't always more information. Sometimes it's a train everyone refuses to miss.

---

### Note O2 — The rain rule that ended careers

On 22 March 1992, South Africa needed 22 runs off 13 balls in a World Cup semi-final. Very gettable. Then it rained for a few minutes.

When play resumed, the scoreboard announced the revised target: 21 runs. Off one ball. The stadium laughed, the batsmen posed for the cameras in defeat, and South Africa were out of the World Cup by arithmetic.

The culprit was the "most productive overs" rule: rain removed overs from the chase, and each lost over deducted only the runs from the *lowest*-scoring overs of the first innings. South Africa's bowlers had bowled two maidens — two overs conceding zero. Their reward for excellent bowling: rain deleted their overs for free. The rule punished the team for having played well. A fairness algorithm with a sign error.

The fix took two statisticians, Frank Duckworth and Tony Lewis, and one correct insight: a chasing team's position isn't a run count, it's *resources* — a function of balls remaining and wickets in hand. Price the resources, scale the target. The Duckworth-Lewis method arrived for the 1999 World Cup and, with Stern's updates, still runs the sport.

The optimum: when an algorithm produces an absurd output, don't patch the output. Fix the state it's measuring.

---

### Note O3 — Kumbh Mela, peak load edition

This January and February, the Maha Kumbh Mela at Prayagraj handled roughly 660 million visits in 45 days. On the single peak day — Mauni Amavasya, 29 January 2025 — official estimates put attendance around 80 million people. One day. One riverbank. That's more than the population of the United Kingdom, arriving with luggage.

Engineers get misty-eyed about systems handling Black Friday. Black Friday does not physically walk into your data center and need a place to sleep.

The genuinely instructive part: this is a pop-up city. Temporary roads, pontoon bridges, power, water, sanitation, and policing are erected on a floodplain — capacity that exists for weeks and then is struck like a stage set. It's the world's largest exercise in provisioning for peak load without paying for peak load year-round: burst capacity, but made of steel plates and tents instead of EC2 instances.

Nobody serves 80 million concurrent users by scaling up one bathing ghat. The load is *partitioned* — dozens of ghats, staged entry corridors, timed processions of the akharas — so the impossible aggregate becomes thousands of merely difficult local problems.

The optimum for peak load has never been a bigger server. It's admission control and sharding, whether the shards hold data or pilgrims.

---

### Note O4 — 1.80 seconds

The fastest Formula 1 pit stop on record: 1.80 seconds — McLaren, changing all four of Lando Norris's tyres at the 2023 Qatar Grand Prix. Blink twice and you missed the tyres coming off *and* going on.

The tempting story is superhuman reflexes. The real story is parallelization under a hard dependency graph. Around 20 crew members work one car: three per wheel (off-gun, tyre off, tyre on), plus jacks and stabilizers. The critical path is a single wheel's sequence — unbolt, swap, bolt — and everything not on that path has been moved off it. Twenty people, under two seconds, zero collisions. It's the most beautiful Gantt chart in sport, performed live.

But the stop is the *small* number. Driving through the pit lane at its speed limit costs roughly twenty seconds versus staying on track. So the strategic question is never "how fast is our stop?" — it's *when* to pay a fixed ~20-second toll for fresh tyres, decided under uncertainty about rain, safety cars, and rivals doing the same math. Teams that lose on Sunday usually lost the scheduling, not the pit stop.

The optimum: shaving the well-optimized 1.8 is worth hundredths. Timing the 20 is worth the race. Optimize the number with the most zeros.

---

### Note O5 — Boarding a plane is a solved problem. We just don't use the solution.

Airline boarding has been studied by an actual astrophysicist. Jason Steffen modeled it in 2008 and found the optimal order: board window seats first in alternating rows, then middles, then aisles — so passengers load luggage simultaneously instead of queueing behind one bag in row 12.

The results, later confirmed in a live experimental test: Steffen's order is roughly twice as fast as back-to-front boarding, and 20–30% faster than purely random boarding.

Sit with that middle result. *Random* — passengers wandering on in no order whatsoever — beats back-to-front, the method most airlines proudly announce by zone. The intuitive scheme performs worse than no scheme, because back-to-front concentrates everyone in the same rows at the same time, maximizing the odds that each passenger waits behind another. It's a queueing pessimum wearing a high-vis vest.

Why don't airlines adopt the optimum? Because it splits families, complicates gate logic, and dissolves the priority-boarding upsell — the constraints are commercial, not physical. Which is fine! But then the honest sentence is "we board suboptimally because it's profitable," not "Zone 3 is now boarding for your convenience."

The optimum exists. It's peer-reviewed. It's just not for sale at the gate.

---

## 5. Posting schedule for the new notes

Existing cadence preserved: essays Tue + Thu 14:00 UTC; amplifier notes trail each essay at 19:30 UTC on post days; the daily one-liner notes at 13:00 UTC ran Jul 9–16. New notes take over the 13:00 UTC daily slot from Jul 17 — no collisions with anything scheduled. Post days (Jul 21, 23, 28, Aug 4, 6) are left free of new notes so each day has exactly one push besides the essay + amplifier.

Sequencing logic: open with the strongest orthogonal note (O1) to plant the flag, then alternate citation notes (weekday, when other writers are online to notice the restack) with orthogonal notes (weekend, when fun travels).

| Date (2026) | Day | Time (UTC) | Note | Content |
|---|---|---|---|---|
| Jul 17 | Fri | 13:00 | O1 | Dabbawalas |
| Jul 18 | Sat | 13:00 | C2 | ByteByteGo / Alex Xu — Discord |
| Jul 19 | Sun | 13:00 | O5 | Airline boarding |
| Jul 20 | Mon | 13:00 | C1 | Pragmatic Engineer / Gergely Orosz — Datadog outage |
| Jul 21 | Tue | — | — | essay day ("One API call…"), amplifier only at 19:30 |
| Jul 22 | Wed | 13:00 | C4 | Experimental History / Adam Mastroianni — Decline of Deviance |
| Jul 23 | Thu | — | — | essay day ("Redis…"), amplifier only at 19:30 |
| Jul 24 | Fri | 13:00 | O4 | F1 pit stops |
| Jul 25 | Sat | 13:00 | C3 | Construction Physics / Brian Potter — AI data center |
| Jul 26 | Sun | 13:00 | O2 | The 1992 rain rule / DLS |
| Jul 27 | Mon | 13:00 | C5 | Age of Invention / Anton Howes — coal |
| Jul 28 | Tue | — | — | essay day ("58%…"), amplifier only at 19:30 |
| Jul 29 | Wed | 13:00 | C6 | Works in Progress / Michael Dnes — Ringways |
| Jul 31 | Fri | 13:00 | O3 | Kumbh Mela |
| Aug 1 | Sat | 13:00 | C7 | Asianometry / Jon Y — design bottleneck |

Notes on execution:

- Jul 30 (Thu) is intentionally empty — no essay is scheduled that day and a one-day gap before the final two notes avoids fatigue.
- For every C-note: post as a restack-with-quote of the cited post where possible (attach the listed URL as the card otherwise), and reply to the author's original post with one sentence from the note. The reply is what starts the relationship; the restack is what starts the distribution.
- After Aug 1, sustain the pattern at lower intensity: ~2 citation notes + 1 orthogonal note per week, written fresh. The 12 above are the opening salvo, not the steady state.
- When any C-note author engages (like, reply, restack), add their publication to The Optimum's official Recommendations the same day and say so in a reply. Recommendations are the strongest reciprocity signal Substack has.

### Research sources used for the diagnosis

- https://pubstacksuccess.substack.com/p/the-notes-algorithm-explained-by
- https://www.writtenmarketing.com/p/substack-algorithm-2025
- https://escapethecubicle.substack.com/p/i-finally-figured-out-how-substacks
- https://thecreatorplaybook.substack.com/p/why-most-substack-newsletters-struggle
- https://writebuildscale.substack.com/p/if-i-started-a-substack-today-id
- https://howwegrowtoday.substack.com/p/the-8-rule-what-analyzing-1500-newsletters
- https://newsletterlab.substack.com/p/what-high-frequency-substack-growth
