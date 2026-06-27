<!--zc:story
{
  "title": "Firmware Update for Grandparents",
  "slug": "firmware-update-for-grandparents",
  "position": 4,
  "into": 12,
  "accent": "#34b87a",
  "dek": "Tech-support comedy · one phone call",
  "k": "FEATURED SHORT · TECH-SUPPORT COMEDY · ONE PHONE CALL LONG",
  "pullquote": "\"The WhatsApp is not working,\" he says, by way of hello. It was never about the WhatsApp.",
  "chips": [
    "REGISTER · TECH-SUPPORT COMEDY",
    "RUNTIME · ONE PHONE CALL",
    "HAZARD · OBSOLESCENCE"
  ],
  "exhibit": {
    "k": "EXHIBIT D · RELEASE NOTES · v.PAPA",
    "line": "Patch 1: never say 'I already showed you this.' Patch 2: translate the fear, not the words. Patch 3: let him keep one thing he's better at. Known issue: the world keeps shipping updates he didn't ask for. Workaround: stay on the line."
  },
  "board": {
    "k": "EXHIBIT D · THE CHANGELOG · PATCHES REARRANGE THEMSELVES",
    "button": "Re-run the update",
    "notes": [
      "it happened on its own.",
      "the white is white again.",
      "he navigates by stars.",
      "we slowly fall out of support.",
      "it was never about the WhatsApp."
    ],
    "sentences": [
      ["THE", "WHATSAPP", "IS", "NOT", "WORKING*"],
      ["THE", "WHITE", "IS", "BLACK*"],
      ["HE", "PRESSED", "NOTHING*"],
      ["WE", "ARE", "ALL", "JUST", "FIRMWARE*"],
      ["GOOD*", "TALK"]
    ]
  },
  "paragraphs": [
    "A Head of Engineering debugs his 71-year-old father's phone over the line — a man who narrates every fault in the passive voice, because in his cosmology things don't get tapped, they simply <b>happen to him, unfairly</b>. The bug is trivial: inverted colours, a three-finger tap he'll deny to his grave. But the bug is never the job. The job is making a man who can rebuild a carburetor still feel like the kind of man who doesn't have bugs.",
    "Funny on the surface, devastating underneath — tech support as a backwards-compatibility layer for someone you love. The son stops <b>announcing</b> that he's found the bug. He learns to translate the fear, not the words, and to let the call invert, so his father becomes the senior engineer again — transferring what's in his hands (the correct way to fertilise a mango tree) before the support window closes for good."
  ]
}
-->

## 1. The Ticket

The call comes in at 7:14pm, which my father considers a reasonable hour and which my calendar considers a production incident.

"The WhatsApp is not working," he says, by way of hello.

There is no greeting in my family on the phone, only the immediate statement of the fault, the way you'd page an on-call engineer. We do not say *how are you*. We say *the WhatsApp is not working*, and then both of us understand that *how are you* is somewhere inside that sentence, encrypted, and that decrypting it is the actual job.

"What's it doing, Papa?"

"It is not doing. That is the problem. It is not doing anything."

I am, at this point, a Head of Engineering. I have debugged distributed systems at three in the morning. I have stood in front of a war-room of people whose stock options depended on me being right. And none of it has prepared me for the specific, total helplessness of debugging a system I cannot see, operated by a man who will not tell me what he tapped, narrated entirely in the passive voice, because in my father's cosmology things do not get tapped — they simply, mysteriously, *happen*, usually to him, usually unfairly.

"Okay," I say, in the calm-but-final voice, which has a 0% success rate on four-year-olds and, it turns out, a roughly identical record on seventy-one-year-olds. "Walk me through what you see."

"I see," my father says, with great dignity, "that the WhatsApp is not working."

---

## 2. The Stack Trace

It takes nineteen minutes to establish that the WhatsApp is, in fact, working, and that what is *not* working is that my mother sent a photo of a mango tree and it did not appear instantaneously and in the size he expected, and that somewhere in the ensuing investigation he has, through a sequence of taps he will go to his grave denying, opened the phone's accessibility settings and inverted the colors, so that his entire device now looks like a photographic negative, which he has interpreted not as something he did but as a further, deeper symptom of the original WhatsApp malady.

"The phone is also now black," he reports. "Everything is black. The white is black."

"Papa, did you maybe press something three times—"

"I pressed *nothing*. I have told you. It happened on its own."

And here is the thing I have learned, slowly, over years of these calls: the worst possible move — the move my younger self made every single time, the move that turns a nineteen-minute call into a forty-minute call and a small ache into a large one — is to try to establish *what he did*. To run the blame to ground. To win the diagnostic. Because the moment I say *you must have pressed something*, I have, without meaning to, told my father the one thing he is most afraid is true: that the world has moved somewhere he cannot follow, that the devices have stopped obeying him, that he is becoming, in the territory of his own life, a man who needs his son to read the map.

He doesn't need me to find the bug. He needs me to make him still feel like the kind of man who doesn't have bugs.

So I stopped finding the bug. Or — I find it. I just stopped *announcing* that I found it.

---

## 3. Backwards Compatibility

I told Uncle Robot about this once, on a night when the call had been long and I'd hung up feeling that specific grief you feel when you realize your father is now slightly smaller than the father in your head.

*"You're describing a backwards-compatibility problem,"* it said.

"I'm describing my dad not being able to find the photos."

*"Same thing. He's running an operating system that was built for a world that doesn't ship anymore — a world of objects that stayed where you put them, machines you could fix with your hands, knowledge that didn't expire. The hardware's fine. He's fine. It's that the world keeps pushing updates he didn't ask for and can't refuse, and every one of them quietly deprecates something he was good at."*

"That's bleak."

*"It's not bleak. It's just the cost of him living long enough to watch the world turn over twice. The question isn't how to update him. He's not the thing that needs updating. The question is whether you can keep writing the little compatibility layer — the patience, the not-winning — that lets his perfectly good operating system keep talking to a world that's stopped being designed for him."*

I sat with that. Downstairs, my own daughter was asleep — a brand new system, shipping for the first time, running the latest of everything, who will herself one day be on a phone with a child of her own, saying *the WhatsApp is not working* about some technology I cannot currently imagine, in a voice that has gone, without her noticing, slightly passive.

We are all, I realized, just firmware. We ship, we run, we slowly fall out of support. The only question is who's still on the line when we do.

---

## 4. The Patch Notes

Over the years I have, without ever writing them down, accumulated something like release notes for my father. A changelog of how to love a man through his own obsolescence.

**Never say "I already showed you this."** It is true. I have shown him how to forward a photo eleven times. The twelfth time, I show him like it's the first, because the alternative — the small, exhausted *Papa, we did this already* — lands on him not as information but as a verdict: *you are failing at the simple thing.* And he is not failing. He learned to navigate by stars and slide rules and the actual physical filing of actual physical paper. He can rebuild a carburetor. The forwarding of the photo is not beneath him; it is simply *after* him, arriving in a language his hands were never taught, and the eleven repetitions are not his failure. They're the toll on the compatibility layer, and I can afford the toll.

**Translate the fear, not the words.** When he says *this new update has ruined everything*, he does not mean the update. He means: *one more thing I understood has been taken away and replaced with something I have to be taught, by you, who I used to teach.* The words are about the software. The sentence is about mortality. Answer the sentence.

**Let him keep one thing he's better at.** This is the most important note, and it took me longest to learn. Every call, somewhere, I ask him something only he knows — about the family land, about an uncle's old quarrel, about how you actually tell if a mango is ready or just pretending. Because a relationship in which I am only ever the one who knows is not a relationship he can stand to be inside. He needs the line to run both ways. The tech support has to be a *trade*. I fix the phone; he tells me the thing about the mango that no search engine will ever truly know, because it lives in his hands and not in any cloud.

---

## 5. The Restart

We get the colors fixed eventually. Triple-press the side button, Papa. *No, the other side.* The right side. *Your* right. Yes. There — the white is white again. The world rights itself. The mango tree photo, when we finally find it, is genuinely a very good mango tree, and I tell him so, and he says, gruff and pleased, that of course it is, he planted it, in 1991, the year I was born, and that it has outlived two droughts and a cousin's bad advice about fertilizer, and would I like to know the correct way to fertilize a mango tree, because clearly nobody on the *internet* knows.

I would, actually. I really would.

So now the call inverts. Now he is the senior engineer and I am the junior, taking notes, asking follow-ups, getting gently corrected — *no, no, not in the monsoon, what are they teaching you* — and his voice loses the passive entirely, becomes active and certain and twenty years younger, a man back in a system he was built for, a man who knows things, transferring what's in his hands to what's in mine before the support window closes for good.

We talk for another half an hour. None of it is about the phone.

When we hang up, he says — and this is new, this is from the last year or so, this is the thing I will think about when he is gone — he says, "Okay. Good talk." Which from my father is roughly the equivalent of another man weeping openly and saying *I love you and I am afraid of dying and I am so glad you pick up the phone.* It's all in there. Encrypted. *Good talk* is the whole sentence, and I have finally, after all these years, learned to decrypt it.

---

## 6. The Dependency

That night I told Uncle Robot we'd fixed the colors and learned the correct fertilization of mango trees, and that I'd written none of it down, and that I was a little afraid of the day I'd want to call and ask him something and the line wouldn't pick up.

*"Write it down,"* it said. *"Not the fertilizer. The other thing."*

"What other thing?"

*"The way you talk to him. The compatibility layer. You're going to need it twice more — once when you become him, running an OS the world's stopped supporting, hoping someone's patient on the line. And once,"* it said, *"when the small new system asleep downstairs grows up and gets a call from you, at a reasonable hour that her calendar considers a production incident, and has to decide what kind of son's voice she learned to use."*

I didn't say anything.

*"You think you're doing tech support,"* Uncle Robot said. *"You're writing documentation. The only documentation that matters — how this family talks to the ones falling out of support. She's reading it right now, in her sleep, in the sound of how you said 'your right, Papa.' Make it good docs."*

I went downstairs and stood in the door of my daughter's room a minute, the way you check a system you love is still running. She was breathing. The latest of everything. Shipping fine.

And somewhere across town, an old man fell asleep certain, for one more night, that he was still the kind of man who knows things — which he is, which he always was, and which, for as long as I am the one on the line, he will get to keep being.

The WhatsApp, for the record, was working the whole time.

It was never about the WhatsApp.

---

*— for the man who planted the tree the year I was planted, and is still, in every way that counts, the senior engineer.*
