[slot] sphere
hold: 2000
bleed: true

[paragraph]
As a freelancer, I haven’t had a lot of official titles — but over my career I’ve taken on many jobs.

It all started with a dream of making feature films. I went to film school and became fascinated with lenses and light. I was going to work in the camera department and see the world through a reflex viewfinder.

[pull]
pushY: 20
> That’s {not} what happened.   | wipe

[paragraph]
My first job out of school was as an assistant editor on a ten-part documentary series. Instead of cameras I immersed myself in organization and post workflows. But what really started here was a life-long education in how to make aesthetic choices and how to create reasons for them. This first zig led to a series of zags that eventually brought me to San Francisco.

[pull]
pushY: 20
colorDelay: 400
colorDurIn: 500
> A city that literally   | wipe
> {changed my life.}   | delay 600, fade, push

[paragraph]
San Francisco is a home to entrepreneurs, thinkers, artists, misfits and other dreamers. It’s a small city wearing boots a few sizes too big — but also a place with deep community — where common interest brings people together and social universes collide in unexpected ways.

And where three distinct yet overlapping worlds left their mark.

[slot] venn

[pull]
colorDelay: 300
colorDurIn: 500
> Design – a {new} way of being.   | wipe

[paragraph]
As a freelance video editor I often found myself waiting on someone else to produce graphics. I’m a patient person — but not on my client’s time — so I was inspired to start creating them myself. That decision opened my eyes to design and to new possibility.

It started with After Effects — Illustrator and Photoshop soon followed. One application opened doors to others — and somewhere in that journey I stopped thinking as much about the tools and more about design itself. Not just as a way to solve problems or create more beautiful work — but as a way of thinking. A way of being.

There is something like an invisible language that threads between all design principles and binds them together — a harmonious color palette, an elegant typesetting, a more efficient UX layout. These are very different things and yet something is common to all of them. A quality — the simple recognition that anything can be improved through its application. That, to me, is the power of design.

[pull]
colorDelay: 400
colorDurIn: 500
> From {Science Fiction}   | wipe
> to {techno-reality.}   | delay 700, wipe

[paragraph]
San Francisco is also a unique nexus in the world of technology. As a sort of spiritual capital to Silicon Valley its central role in tech innovation further altered my trajectory. Much of my creative energy has been directed towards promoting or explaining technology.

It made sense — as a child I was a voracious reader of science fiction, delighting in future possibility. But here I found myself drawn into present reality — technology NOW — and all the ways in which it shapes our lives. How does it solve problems and remove barriers? Where can it be improved? Who does it empower? Finding the answers to those questions remains the kind of mission I want to be part of.

[pull]
colorDelay: 300
colorDurIn: 500
> An empty desert {full of art.}   | wipe

[paragraph]
Burning Man was born in San Francisco and its cultural roots stretch deep into its history and people. It is many things: an experiment in community and self-expression; a vast ephemeral art gallery; a festival of culture, music and technology; a perfect confluence of the ridiculous and the sublime. But fundamentally it too is a way of being. A path towards greater self-expression, stronger community and positive social values.

The world of art and culture were already familiar to me — my degree is in “Fine Art” after all, but like many, my eyes, ears and mind were only so open. Burning Man expanded my taste and broadened my horizons. Over the years I’ve created many things out in the desert and beyond — interactive sculptures of light and sound, raucous dance parties, experiential media — a bowling alley. But above all else what I found in the desert was a clearer picture of myself and a deeper connection with my communities.

Similar to the way design changed my life, this greater exposure to art and self-expression colors every part of how I live. I make my own art — and I help others make theirs.

[pull]
duration: 1000
pushY: 18
> But wait,    | fade, push
+ there’s {more}   | delay 500, fade

[paragraph]
San Francisco had more communities to offer — I became a rock climber, a bike racer, a DJ, and a baker of pies. But in my connection to media production I was led to perhaps the deepest and most impactful one: the world of documentary films.

I’ve made three feature-length documentaries and contributed to a number of others. While I have a range of feelings about the end products, I can say with total sincerity that the experience of creating them changed me for the better.

I imagine that many people believe the key to a successful documentary is discovering a great, untold story. My experience suggests that while this is certainly possible, the greater truth is that any story can be great. It then follows that one must find the contours of the story, understand its structure and — most importantly — feel its value.

One must empathize with one’s subject, but also one’s audience. We can never truly know another’s experience — but if we cultivate our hearts and minds to be open to them, we can get closer. A well-crafted documentary is like a window of empathy — it allows us to see inside another person, to feel their story. It also lets us see inside ourselves.

I believe that same empathy is at the core of good design (and art, and technology). Understanding the problem, feeling for the client’s needs, and genuinely considering the intended audience — empathy is what elevates good design into great design.

And I think a well-developed sense of empathy is part of what makes a good human. I’ve written a fairly long essay on the topic — you can find it over on Medium — but the core premise is that empathy opens us up to greater possibility in all aspects of life. It’s certainly what I’m trying to do.

[paragraph]
The more we understand about ourselves the more we see there is to know. It feels almost fractal — there’s more to this story. This is just where I am right now.

// ─────────────────────────────────────────────────────────────────────────
// SLOTS
//
//   [slot] name        the PAGE supplies the element; this only says where it
//                      sits in the sequence and what it is called
//   bleed: true        escape the content column and span the viewport. The
//                      sphere needs it: its framing is a share of the SCREEN,
//                      and inside the column that silently shrinks it by a
//                      quarter on desktop. Knowing exception to the
//                      leftmost-element principle, like SiteBackground.
//   hold: <ms>         everything after it waits this long — the sphere is a
//                      continuous canvas with no completion to report, so its
//                      hold is a duration. Like every hold this is a RESTING
//                      pace rule: scrolling toward new content releases it.
//
// ─────────────────────────────────────────────────────────────────────────
// PULL QUOTE OPTIONS — omit any field to get its default.
//
//   duration    1500   ms — the chunk fade / wipe / push duration
//   feather       60   %  — softness of the wipe edge
//   pushY          0   px — vertical offset it rises from
//   pushX          0   px — horizontal offset it slides from
//   colorDelay     0   ms — wait before the {highlight} starts colouring
//   colorDelay/colorDurIn/colorHold/colorDurOut form the highlight timeline:
//   colorDurIn     0   ms — ramp white -> page colour  (0 = snap)
//   colorHold      0   ms — hold at full colour before fading back
//   colorDurOut    0   ms — ramp back to white         (0 = stays coloured)
//
// CHUNKS:
//   >  starts a new LINE
//   +  continues the SAME line, beside the chunk before it
//   |  separates the text from its flags
//   flags: wipe, fade, push, delay <ms>
//
//   {braces} mark a highlight. The highlight colour is the PAGE colour —
//   there is no per-quote colour field.
//
// Unknown option keys and flags warn in the console rather than being
// silently dropped.
// ─────────────────────────────────────────────────────────────────────────
