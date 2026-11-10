# Supabox — Product Requirements

**Tagline:** Your games. Your story. *(provisional)*
**Category:** Social gaming platform / video game diary
**Platform:** Web first (responsive). Native iOS/Android (Expo) and desktop come later.

## 1. Vision

Supabox is a social diary for video games: a personal gaming journal combined with a friendly social network. Players track what they want to play, are playing and have finished; rate and review games; keep a diary of every playthrough; build lists; and discover games through the people they follow.

Supabox is **not** a launcher, store or news site.

### Principles
1. **Simplicity.** Logging a game or publishing a review takes seconds.
2. **Personal expression.** Your history reflects your taste.
3. **Community.** Discovery through friends is central.
4. **Visual quality.** Cover art is the centrepiece, with a premium dark-first look.
5. **Performance.** Fast, accessible and reliable.

## 2. Audience

Casual and dedicated PC and console players, people who already log films, books or games (Letterboxd, Backloggd, GG), and review writers. Launch language is English, with Brazilian Portuguese added through i18n.

## 3. Information architecture

Four primary destinations appear in a permanent top navigation bar (a bottom tab bar on mobile). The logo links to Home.

```
SUPABOX (logo → Home: activity feed, featured releases, recent reviews)
├── Games     /games            Recently Released · Coming Soon · Search · Game details · Quick wishlist
├── Lists     /lists            Featured · Recently Created · My Lists · Create · Details
├── Reviews   /reviews          My Reviews · Following
└── Profile   /profile          Header · Five Favorite Games · Recent Ratings · Recently Played
                                 · Completed · Lists · Recent Reviews · Library · Wishlist
Secondary: /library, /library/wishlist, /users/[username], /games/[slug], /lists/[id],
           /lists/new, /lists/[id]/edit, /profile/edit, /sign-in, /sign-up, /forgot-password
```

Library is not a primary tab. It's reached from the Profile page, the account menu and a header shortcut on large screens.

## 4. Features and user stories

### 4.1 Authentication (Phase 2)
As a visitor I can sign up, sign in, sign out and reset my password, and stay signed in. This uses Supabase Auth; Supabox never stores passwords.

### 4.2 Profiles
- Unique username, display name, avatar, bio, follower and following counts.
- Public URL: `/users/[username]`. The owner's view is at `/profile` with an **Edit Profile** button; visitors see **Follow**.
- **Five Favorite Games:** an ordered selection of up to 5 that you can add, remove, replace and reorder. The order is preserved, and empty slots appear as placeholders to the owner.
- **Recent Ratings:** cover, title, stars and date, newest first.
- Recently Played, Completed, Lists, Recent Reviews, and links to Library and Wishlist.
- The data model leaves room for future privacy settings.

### 4.3 Game catalogue
Title, cover, description, release date, developer, publisher, platforms, genres, community rating and reviews. The data model separates **released** games (release date on or before today) from **upcoming** ones (future date or TBA). A provider abstraction keeps user data independent of the catalogue source.

### 4.4 Games page (`/games`)
- Search by title, studio, genre or platform.
- **Recently Released:** released titles only, newest first, in a responsive cover grid.
- **Coming Soon** section for upcoming games.
- Each card shows cover, title, release date, platforms, a quick wishlist toggle and a link to the details page.
- Loading, empty and error states.
- Planned: filters by genre, platform, release year and popularity.

### 4.5 Library and wishlist
- Statuses: Want to Play, Playing, Completed, Dropped. You can add a game without giving dates or a review.
- **The wishlist is the Want to Play status.** There is one record per user and game, so a game can't be wishlisted twice.
- The wishlist toggle adds a game as Want to Play or removes it. It never overwrites another status: a Completed game shows as "In library".
- `/library` has status filters, sorting and counts. `/library/wishlist` shows the total, a sort control and a link to each game.
- Signed-out visitors who try to save a game get a sign-in prompt.

### 4.6 Ratings and reviews
- Optional 0.5–5 star ratings in half steps, which you can change at any time.
- A review can be a rating only, text only, or both. There is one review per user per game, and you can edit or delete it.
- Spoiler marking hides the text until the reader reveals it.
- The community average uses valid ratings only.
- `/reviews` has two tabs:
  - **My Reviews:** most recently published or edited first, with Edit and Delete.
  - **Following:** reviews by people you follow, newest first by publication date, with links to the reviewer and the game. It has empty states for "not following anyone" and "nobody has posted yet".

### 4.7 Gaming diary
Each playthrough is a separate entry (first playthrough, replay, or returned to it) with a start date, an optional finish date and a note. The diary is separate from the current library status.

### 4.8 Lists
- Any signed-in user can create themed lists with a title, an optional description, public or private visibility, and an ordered set of games. Games can be added, removed and reordered, and don't have to be in your library.
- Owners can edit and delete their lists.
- `/lists` shows **Featured Lists** (editorial picks, with no invented popularity metrics), **Recently Created**, and My Lists.
- `/lists/[id]` is shareable. Private lists are visible to their owner only.

### 4.9 Social
Follow and unfollow, public profiles, a chronological activity feed (started playing, completed, added to library, published a review) with duplicate events removed. Likes, comments, direct messages and notifications come later.

## 5. MVP scope

**In:** everything in section 4, plus a licensed catalogue (Phase 3), the responsive web app, and English UI with i18n scaffolding for pt-BR.
**Out for now:** native apps, likes and comments, DMs, notifications, recommendations, game-time import.

## 6. Non-functional requirements
- WCAG AA contrast, keyboard navigation, visible focus, semantic HTML, and respect for reduced motion.
- Server components by default, images optimised, pagination for large lists.
- Authorisation enforced on the server and in PostgreSQL RLS. Secrets are never exposed to browsers.
- Privacy by design for Brazil's LGPD: data export and deletion, minimal personal data.
