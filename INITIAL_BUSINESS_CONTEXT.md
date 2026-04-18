# Campfire Business and Product Base Document

## 1. Executive summary

**campfire** is a private portal designed for a closed group of friends who casually gather to play music together. Its core goal is to organize, make visible, and operationalize the musical knowledge distributed across the participants.

The main problem the product aims to solve is the lack of clarity, during gatherings, about **which songs can be played by the people currently present**. Today, that knowledge tends to be scattered across individual memory, which reduces the flow of the gathering, makes song requests harder, and limits the use of the group’s collective repertoire.

campfire exists to allow authenticated and previously authorized users to indicate which songs they know how to play, including associating that knowledge with specific instruments. As a result, during a gathering, the group can consult the portal to discover viable repertoire options based on the people who are present.

This is a **small, private, social, and contextual** product, intended for recurring use by approximately 10 people, rather than a public music platform at mass scale.

---

## 2. Product vision

The central proposition of **campfire** is to serve as a **shared repertoire portal** for a closed group of friends who meet in person to play music.

Its purpose is to transform implicit and distributed knowledge into accessible, useful, and actionable information during gatherings. Instead of relying only on the group’s memory about “who can play what,” the product creates a single point of reference to support spontaneous decisions about what can be played together.

More than a generic song catalog, campfire appears to exist to answer a recurring and practical question in the context of these gatherings:

> **“Given who is here right now, what can we play?”**

### Confirmed facts
- The project is called **campfire**.
- It is a portal with access for authenticated users.
- Access is restricted to users previously selected in a specific list.
- The product is related to music-oriented functionality.
- Users can register songs they know how to play.
- Musical knowledge can be associated with an instrument.
- The group uses the system to analyze which songs the people present know how to play.

### Assumptions
- **Assumption:** the portal’s main value is supporting in-person gatherings in real time or close to real time.
- **Assumption:** the product prioritizes practicality and fast consultation over advanced musical depth.
- **Assumption:** the focus is not public music discovery, but rather repertoire coordination among known friends.

### Open questions
- Should the system support only live gathering consultation, or also preparation ahead of time?
- Should the portal reflect only what each person “knows how to play,” or also their level of mastery / confidence?

---

## 3. Context and motivation

campfire emerges from an intimate social context: a recurring group of friends who casually meet to play music together. These gatherings include people who actively perform music and people who participate more as listeners or song requesters.

In this kind of dynamic, the possible repertoire often depends on multiple informal factors: who showed up, which instruments are available, which songs each participant knows, and which requests arise in the moment. Without a shared reference point, the group has to rely on memory, repeated questions, or improvised attempts.

The friction that justifies the solution is less technological and more organizational: the knowledge exists, but it is dispersed. campfire reduces that dispersion by recording each participant’s declared repertoire and enabling consultation aligned with the current composition of the gathering.

### Confirmed facts
- The gatherings are informal.
- The group is made up of friends.
- There are approximately 10 users.
- There are two main behavioral profiles: musicians and audience members.
- The audience tends to request songs during the gatherings.
- Musicians know how to play songs on specific instruments.

### Assumptions
- **Assumption:** before campfire, the group mostly relies on informal memory and spontaneous conversation to decide what to play.
- **Assumption:** there is value in reducing the time spent deciding what to play.
- **Assumption:** the gathering experience improves when there is more visibility into the group’s musical possibilities.
- **Assumption:** the environment is collaborative and leisure-oriented, not professional performance-oriented.

### Open questions
- Are the gatherings frequent enough to justify ongoing use of the portal?
- Does the group usually play full songs or excerpts / simplified versions?
- Does instrument availability vary by gathering?

---

## 4. Business problem / opportunity

### Main problem

The main problem is the **low visibility into the collective repertoire available at each gathering**, which creates friction when deciding which songs can be played by the people present.

This problem manifests in practical ways:
- song requests without clarity on feasibility;
- repeated questions such as “who knows how to play this?”;
- underused repertoire due to forgetfulness;
- difficulty making the most of the combination of people present at a given gathering.

### Secondary opportunities

1. **Increase use of the group’s repertoire**  
   Make already-known but often-forgotten songs visible.

2. **Improve the audience experience**  
   Enable song requests that better match the gathering’s actual repertoire.

3. **Facilitate informal coordination among musicians**  
   Help participants identify musical overlap between one another.

4. **Build collective memory for the group**  
   Provide a simple way to record what each person knows how to play over time.

5. **Support gathering preparation**  
   **Assumption:** the portal may also serve as a pre-gathering consultation tool, helping the group plan possible songs.

### Open questions
- Is the main goal to maximize possible repertoire or to make song requests easier?
- Should the product prioritize spontaneity during the gathering or advance preparation?
- Is there interest in recording gathering history and songs played?

---

## 5. Target audience

The primary target audience for campfire is a **small, closed, and previously authorized group of friends** who share in-person musical gatherings.

There is no evidence that the product is intended to serve public users, strangers, or open communities. Based on the provided context, its business design is centered on a specific social circle, with low scale and strong relational ties among participants.

### Target audience characteristics

| Aspect | Description |
|---|---|
| Estimated size | Approximately 10 users |
| Group type | Closed, private, previously selected |
| Relationship between users | Friends |
| Usage context | Informal gatherings to play music |
| Nature of access | Restricted to authenticated and authorized users |
| Expected scale | Small, not mass-market |

### Confirmed facts
- The group is closed.
- Users are previously selected.
- Access is authenticated.
- The group has about 10 people.

### Assumptions
- **Assumption:** all users already know each other.
- **Assumption:** there is no initial need for complex discovery, large-scale moderation, or growth mechanisms.
- **Assumption:** group privacy is more important than reach or virality.

### Open questions
- Will all group members have an account in the system?
- Is access individual-only, or can there be temporary guest users?
- Is there someone responsible for managing the authorized users list?

---

## 6. User profiles / personas

### Persona 1 — Musician

A person who plays one or more instruments and participates in the gathering by performing songs. Their main interest in campfire is to register the songs they know how to play and use that information to find possible repertoire with others who are present.

**Goals**
- Declare songs they know how to play.
- Associate songs with instruments.
- Consult possible repertoire for a gathering.
- Understand what other musicians present know how to play.

**Pain points**
- Being asked repeatedly what they know how to play.
- Forgetting songs they could play with the group.
- Having difficulty coordinating repertoire informally.

**Value generated**
- Less friction in decision-making.
- More visibility into their own repertoire.
- Better musical combination among participants.

### Persona 2 — Audience member

A person who attends the gatherings, usually does not play instruments, but interacts by requesting songs and participating in the social dynamic. Their interest in campfire is to discover what the group can play and make more feasible song requests.

**Goals**
- Explore songs that are possible in the current gathering.
- Make requests more aligned with the group’s capabilities.
- Participate in the musical experience even without playing.

**Pain points**
- Requesting songs that are not feasible without knowing it.
- Having no visibility into the available repertoire.
- Depending on musicians’ memory to understand possibilities.

**Value generated**
- Greater predictability about what can be played.
- Better social participation in the gathering.
- Reduced frustration when requesting songs.

### Persona 3 — Group curator / administrator
**Assumption**

**Assumption:** there may be an informal role for someone who manages the list of authorized users, organizes the group, or maintains the portal’s basic operation.

**Possible responsibilities**
- Authorize or maintain the access list.
- Support initial onboarding / registration.
- Ensure minimal data consistency.

### Open questions
- Are there formal roles beyond musician and audience member?
- Can the same user act as both musician and audience member in different contexts?
- Should the system reflect fixed profiles or only contextual behaviors?

---

## 7. Value proposition

### Value for musicians
- Centralizes declaration of individual repertoire.
- Makes it easier to identify what can be played together.
- Reduces repeated questions and reliance on group memory.
- Helps make better use of the participants present at a gathering.

### Value for the audience
- Provides visibility into songs that are potentially playable.
- Enables more realistic and contextualized requests.
- Increases the participation of people who do not play instruments.

### Value for the group as a whole
- Creates shared memory of the group’s repertoire.
- Improves the flow of gatherings.
- Reduces uncertainty and unnecessary improvisation when choosing songs.
- Makes distributed knowledge more accessible.
- Strengthens the social experience around music.

### Assumptions
- **Assumption:** the main benefit is social and musical coordination, not technical performance.
- **Assumption:** the product’s usefulness grows as more people keep their repertoire up to date.

### Open questions
- Does the group value speed of consultation more, or detailed repertoire accuracy?
- Is there interest in recording preferences in addition to capabilities?

---

## 8. Main use cases

### Confirmed core use cases

1. **Authenticate access to the portal**  
   The user enters campfire through authenticated access.

2. **Restrict access to authorized users**  
   Only previously selected people can use the system.

3. **Register a song the user knows how to play**  
   The user informs the system that they know how to play a given song.

4. **Associate an instrument with a registered song**  
   The declared knowledge can be linked to a specific instrument.

5. **Allow multiple users to declare the same song**  
   Different people can state that they know how to play the same song.

6. **Consult possible repertoire based on the people present**  
   During the gathering, the group checks which songs the people present know how to play.

### Inferred use cases
**Assumption**

7. **Edit or remove declared musical knowledge**  
   **Assumption:** users will likely need to update or correct their repertoire.

8. **View who knows how to play a given song**  
   **Assumption:** in addition to listing possible songs, it may be useful to identify which participants support each song.

9. **Mark presence in the current gathering**  
   **Assumption:** to analyze repertoire based on who is present, some presence mechanism or manual participant selection may be needed.

10. **Explore available songs without playing an instrument**  
    **Assumption:** the audience may consult the repertoire even without registering musical knowledge.

### Open questions
- How will presence be determined: explicit check-in, manual selection, or another mechanism?
- Should the system consider only human presence, or also instrument availability?
- Should song registration use a controlled catalog or free text?

---

## 9. High-level usage flows

### Flow 1 — Musician registering a song

1. The authenticated user accesses campfire.
2. They enter the area where they manage their repertoire.
3. They search for or enter a song.
4. They indicate that they know how to play that song.
5. They associate the relevant instrument through which they know it.
6. They save the record.
7. The song becomes part of their declared repertoire in the system.

**Confirmed facts**
- Users can register songs they know how to play.
- Musical knowledge can be associated with an instrument.

**Assumptions**
- **Assumption:** the user can review or edit this registration later.
- **Assumption:** the flow will be simple, given the small group size and informal use context.

---

### Flow 2 — Group checking what can be played at a gathering

1. Participants gather in person.
2. The group accesses campfire.
3. The system considers or receives information about who is present.
4. The group consults songs compatible with the people present.
5. Based on that view, the group chooses songs to play.

**Confirmed facts**
- The group can analyze which songs the people present know how to play.

**Assumptions**
- **Assumption:** this consultation happens during or immediately before the musical moment.
- **Assumption:** the ideal result presents the gathering’s potential repertoire clearly.

**Open questions**
- Does the criterion for “can be played” depend on how many people know it?
- Should the system show any song known by at least one person present, or only songs with a minimum viable combination of participants?

---

### Flow 3 — Audience exploring song possibilities

1. The audience member accesses campfire.
2. They view the possible repertoire for the current gathering.
3. They explore available songs or search for a specific song.
4. They make requests that better match what the group can play.

**Confirmed facts**
- There are users with an audience profile.
- The audience typically requests songs.
- The portal allows analysis of which songs the people present know how to play.

**Assumptions**
- **Assumption:** the audience also has access to consultation, even without participating in musical execution.
- **Assumption:** the ideal experience for the audience is more about exploration and consultation than repertoire maintenance.

---

## 10. Business entities and concepts

### Confirmed and inferred entities

| Entity / concept | Status | Description |
|---|---|---|
| User | Confirmed fact | Person authenticated to access the portal |
| Authorized users list | Confirmed fact | Restricted set of people previously selected for access |
| Song | Confirmed fact | Musical item that can be declared as known by users |
| Instrument | Confirmed fact | The means through which the user knows how to play a song |
| Declared musical knowledge | Strongly supported inference | Relationship between user, song, and instrument indicating that the person knows how to play it |
| Behavioral profile | Confirmed fact | Distinction between musician and audience member in the product’s social context |
| Presence at the gathering | Strongly supported inference | State required to filter repertoire based on who is present |
| Gathering / session | Inference | Social occasion in which the group gets together to play music |
| Possible repertoire | Strongly supported inference | Set of songs that are viable given the participants present |
| Song request | Inference | Interaction in which someone asks for a song in the gathering context |

### Important notes
- “Musician” and “audience” appear to be **behavioral profiles**, not necessarily rigid user classes.
- “Declared musical knowledge” is a central domain concept, even though it was not explicitly named in the original context.
- “Presence at the gathering” is essential to the value proposition, but its mechanism has not yet been confirmed.

### Open questions
- Should song be treated as title only, or include artist / version?
- Can a user associate more than one instrument with the same song?
- Should the system represent skill level / proficiency?
- Will “gathering” be an explicit entity or just a temporary filter of present participants?

---

## 11. Initial business rules

### Explicit rules

1. Access to campfire is restricted to authenticated users.
2. Access is only allowed to people previously selected in a specific list.
3. Users can register songs they know how to play.
4. Musical knowledge can be associated with an instrument.
5. More than one person can declare that they know how to play the same song.
6. Repertoire analysis depends on the people present at the gathering.

### Inferred rules, stated cautiously
**Assumption**

7. **Assumption:** a single user can declare many songs.
8. **Assumption:** the same song can be associated with different users.
9. **Assumption:** a single user may know how to play the same song on more than one instrument.
10. **Assumption:** repertoire consultation should be simple enough for use during an in-person gathering.
11. **Assumption:** the system’s reliability depends on honest and reasonably up-to-date self-declaration.
12. **Assumption:** the system does not need complex moderation rules, given the group’s small and private nature.

### Open questions
- Is there any review or approval of registered repertoire?
- Should there be song name standardization to avoid duplicates?
- Will “knows how to play” have a shared minimum definition among users?
- Will presence be managed automatically or entered manually?

---

## 12. Business functional requirements

1. The product must allow user authentication.
2. The product must restrict access to previously authorized users only.
3. The product must allow an authenticated user to register songs they know how to play.
4. The product must allow musical knowledge of a song to be associated with an instrument.
5. The product must allow multiple users to register knowledge of the same song.
6. The product must allow consultation of an individual user’s declared repertoire.
7. The product must allow consultation of which songs can be played considering the people present at a gathering.
8. The product must allow users to see which participants support a given repertoire possibility. **Assumption**
9. The product must allow updating the repertoire declared by each user. **Assumption**
10. The product must provide simple and readable consultation for use in informal gatherings.
11. The product must clearly distinguish between individual repertoire and the group’s potential repertoire. **Assumption**
12. The product must be usable by both musician-profile participants and audience-profile participants. **Assumption**
13. The product must make the private nature of the environment and user base clear.
14. The product must allow identification or selection of the people present for calculating possible repertoire. **Strongly supported assumption**

---

## 13. Non-functional requirements oriented to business context

### Essential to the context

| Requirement | Description |
|---|---|
| Simplicity | The product must be easy to understand and use by a small group, without requiring training |
| Usability | Repertoire consultation must be fast and clear, especially during in-person gatherings |
| Privacy | Information and access must remain restricted to the authorized group |
| Restricted access | The system must reflect the closed nature of the group, avoiding unintended public exposure |
| Information clarity | It must be easy to understand who knows how to play what, and on which instrument |
| Simple maintenance | The product must be sustainable with low operational effort |
| Low usage friction | The system’s value depends on recurring adoption; therefore flows must be short |
| Contextual reliability | The information displayed must consistently reflect declared repertoire |
| Small-scale adequacy | The system must not assume mass volume or complex processes typical of open platforms |

### Assumptions
- **Assumption:** the mobile experience may be important, given use during in-person gatherings.
- **Assumption:** tolerance for complexity is low, since the product competes with the natural informality of the group.
- **Assumption:** speed of understanding is more important than overly rich metadata.

### Open questions
- Is there a need for offline use or support under unstable connectivity?
- Does the group value fast registration more, or cataloging accuracy?
- Is there any specific accessibility need for a group member?

---

## 14. Suggested initial scope (MVP)

The MVP should prioritize what makes campfire useful in the very first gatherings, without depending on secondary features.

### Suggested MVP items

1. **Authentication for authorized users**  
   Essential to reflect the private and controlled nature of the group.

2. **Individual repertoire registration**  
   Allow each user to declare which songs they know how to play.

3. **Association between song and instrument**  
   Essential to represent musical knowledge in a minimally useful way.

4. **Per-user repertoire consultation**  
   Necessary to provide transparency into registered data and deliver basic utility.

5. **Possible repertoire consultation based on who is present**  
   Core to the product’s value proposition.

6. **Simple view for use during a gathering**  
   Essential to turn registered data into practical decision support.

7. **Ability to update declared repertoire**  
   Important to prevent the data from becoming quickly outdated. **Assumption**

### Why this belongs in the MVP
These items cover the minimum value cycle:
- controlled user access;
- musical knowledge registration;
- instrument-based context;
- practical use of the information during the gathering.

Without this set, the product is likely to become just a static registry with little real impact on the group’s social dynamic.

---

## 15. Out of initial scope

The items below may sound interesting, but they are **not confirmed** as part of the initial scope and should not be treated as starting requirements:

- integration with Spotify, Apple Music, or similar services;
- audio streaming or music playback;
- automatic display of chords, lyrics, or tablature;
- intelligent song recommendation;
- user ranking, gamification, or scoring;
- comments, reactions, or social feed;
- musician marketplace;
- opening the platform to the public community;
- advanced event scheduling;
- recording of performances;
- social matching among external users;
- large editorial music catalog;
- advanced arrangement automation;
- professional band or contract management.

### Note
These items are not invalid as future evolutions, but they are misaligned with the confirmed initial problem, which is simple, private, and centered on informal gatherings among friends.

---

## 16. Hypotheses and possible evolutions

### Hypotheses
1. **Hypothesis:** allowing explicit presence marking at a gathering may improve the accuracy of suggested repertoire.
2. **Hypothesis:** allowing song search may make audience requests easier.
3. **Hypothesis:** showing which instruments are represented in the gathering may better support the group’s decision-making.
4. **Hypothesis:** allowing users to indicate level of mastery for a song may improve the quality of possible repertoire.
5. **Hypothesis:** recording songs played in past gatherings may help vary the repertoire.
6. **Hypothesis:** allowing favorite or most-recurring repertoire may speed up gatherings.
7. **Hypothesis:** allowing suggestions based on who is present may increase practical usefulness.
8. **Hypothesis:** separating views for musicians and audience members may improve usability.
9. **Hypothesis:** a “current gathering” mode may concentrate the most relevant information at meeting time.
10. **Hypothesis:** the system may evolve to support preparation before gatherings, in addition to live use.

### Important
None of the hypotheses above should be treated as confirmed requirements without future validation with the group’s users.

---

## 17. Risks, limitations, and dependencies

### Risks

| Risk | Description | Potential impact |
|---|---|---|
| Adoption within a small group | With few users, low adoption by 2 or 3 people already significantly reduces product value | High |
| Manual data staleness | The repertoire depends on users keeping it updated themselves | High |
| Self-declaration accuracy | “Knowing how to play” may mean different things to different participants | Medium / High |
| Dependence on presence | The core value depends on knowing who is present at the gathering | High |
| Overreliance on a single organizer | **Assumption:** if there is an informal responsible person, the product may depend too much on them | Medium |
| More complexity than needed | A product that is too sophisticated may lose fit in the informal context | High |
| Musical catalog ambiguity | Song names may generate duplication or confusion | Medium |

### Expected limitations
- The system reflects declared knowledge, not necessarily real capability in every situation.
- The small group limits both data volume and the statistical robustness of metrics.
- The product’s value depends on the habit of consulting it during real gatherings.
- There is no confirmation of usage beyond the original social circle.

### Dependencies
- Active user participation in registering and updating repertoire.
- A clear definition of who belongs on the access list.
- Some mechanism to indicate who is present at the gathering. **Assumption**
- A minimal shared understanding in the group of what it means to “know how to play” a song. **Assumption**

---

## 18. Suggested success metrics

For a small and closed product, simple and pragmatic metrics are more appropriate than sophisticated scale indicators.

### Suggested metrics

1. **Total number of songs registered in the group**  
   Measures growth of declared repertoire.

2. **Average number of songs registered per active user**  
   Measures depth of individual contribution.

3. **Percentage of users with a filled repertoire**  
   Measures minimum adoption of the model.

4. **Frequency of use on gathering days**  
   Measures adherence to the main value context.

5. **Number of possible-repertoire consultations per gathering**  
   Measures usefulness at the actual moment of use.

6. **Repertoire coverage per gathering**  
   **Assumption:** proportion of gatherings in which the system can present a useful set of possible songs.

7. **Rate of repertoire updates over time**  
   Measures content vitality.

8. **Subjective usefulness perceived by the group**  
   **Assumption:** simple feedback on whether campfire helped the group decide what to play.

9. **Rate of fulfillable audience requests**  
   **Assumption:** percentage of requests that find a viable match in the repertoire present.

### Open questions
- Does the group want to measure success formally, or only perceive practical usefulness?
- Is it worth recording gathering history in order to measure recurring usage?

---

## 19. Assumptions made

1. **Assumption:** campfire is primarily intended for use during in-person gatherings or very close to them.
2. **Assumption:** the system was not initially designed as a public platform or for large-scale communities.
3. **Assumption:** the central value is reducing friction in musical coordination among friends.
4. **Assumption:** repertoire consultation should be simple, fast, and appropriate for the informal context.
5. **Assumption:** users need to edit or update registered repertoire.
6. **Assumption:** to calculate possible repertoire, some mechanism will be needed to identify who is present.
7. **Assumption:** a user can associate songs with more than one instrument.
8. **Assumption:** the audience also accesses the system, at least for consultation.
9. **Assumption:** there may be someone who manages the list of authorized users.
10. **Assumption:** the group benefits from a shared memory of its repertoire.
11. **Assumption:** there is no initial need for advanced community, monetization, or public discovery features.
12. **Assumption:** the system depends on honest and updated self-declaration.
13. **Assumption:** there may be value in using campfire before the gathering as well, for preparation.
14. **Assumption:** mobility and fast readability may be relevant in the usage context.
15. **Assumption:** “musician” and “audience” are behavioral profiles rather than rigid and mutually exclusive categories.

---

## 20. Open questions

1. Who manages the list of authorized users?
2. Will all group members have individual accounts?
3. How will presence at a gathering be determined?
4. Will “knows how to play” have any shared minimum definition?
5. Will song registration be free-form or based on a standardized catalog?
6. Will a song be identified only by name, or also by artist / version?
7. Will a user be able to associate multiple instruments with the same song?
8. Should the system show only possible repertoire, or also explain why a given song is viable?
9. Will the audience only be able to consult, or also interact in other ways?
10. Will there be formal differentiation between user types?
11. Will the portal be used only during gatherings, or also for preparation beforehand?
12. Is there value in recording history of gatherings and songs played?
13. Should the system consider instrument availability in addition to human presence?
14. Is there a need for mechanisms to avoid duplicate songs being registered?
15. Does the product need to reflect level of mastery, key, version, or song complexity?
16. What level of data governance is appropriate for such a small group?
17. Is there a need to support temporary guests?
18. Does the group want any explicit success metric, or only perceived usefulness?
19. Does the name “campfire” carry symbolic meaning that should influence product identity and positioning? **Assumption for investigation**
20. Is there future intent to expand the product beyond the original group?

---

## 21. Operational summary for future AIs

### What the product is
**campfire** is a private portal for a closed group of friends who casually gather to play music. It organizes participants’ declared repertoire to support decisions about what can be played at each gathering.

### Who uses it
- Authenticated and previously authorized users.
- A group estimated at approximately 10 people.
- Two confirmed main profiles:
  - **Musician**: plays instruments and registers songs they know how to play.
  - **Audience member**: usually does not play, but participates by requesting songs and exploring possibilities.

### What problem it solves
It solves the lack of visibility into the **collective repertoire available at the current gathering**. Without the system, the group relies on memory and repeated questions to know what can be played by those present.

### Which entities are central
- **User**
- **Song**
- **Instrument**
- **Declared musical knowledge** *(central inference)*
- **Behavioral profile**
- **Presence at the gathering** *(strongly supported inference)*
- **Possible repertoire**
- **Gathering / session** *(inference)*

### Which rules matter most
- Access is restricted to authenticated and authorized users.
- Users can declare songs they know how to play.
- Musical knowledge can be associated with an instrument.
- Multiple users can know the same song.
- The main utility depends on crossing declared repertoire with the people present.

### What the MVP is
- Authentication and restricted access.
- Registration of songs the user knows how to play.
- Association between song and instrument.
- Individual repertoire consultation.
- Possible repertoire consultation based on who is present.
- Simple updating of declared repertoire. **Assumption**

### What is still uncertain
- How presence will be informed.
- Whether there will be formal roles beyond musician and audience.
- Whether there will be a standardized song catalog.
- Whether the system will model musical mastery level.
- Whether there will be gathering history or only moment-based consultation.
- Whether usage will be live-only or also include pre-gathering preparation.

### Strategic reading for AI agents
When working on the project, treat campfire as:
- a **small and private** product;
- oriented toward **social and musical coordination**;
- centered on **in-person gatherings**;
- dependent on **data declared by users themselves**;
- focused on **clarity, simplicity, and practical usefulness**, not on mass scale or sophisticated public-platform features.