# Movie Library

Web application with Node.js + Express backend and MongoDB database.  
Users can browse movies/TV series, like content, and write comments. Admin can manage content and view statistics.

## 1) Project Overview
**Features**
- Authentication with sessions (login/logout) and role-based access control (user/admin).  
- Content browsing: movies & TV series.
- Search by title (redirect to watch page).
- Likes (toggle like, favourites list).
- Comments: create/read; edit/delete only by the comment author.
- Admin panel (CRUD for movies and TV series).
- Statistics endpoint with MongoDB aggregation: Top liked content.

## 2) Tech Stack
- Node.js, Express
- MongoDB (native `mongodb` driver)
- HTML/CSS/Bootstrap + vanilla JS frontend
- Sessions: `express-session` (optionally with Mongo session store)

## 3) How to Run Locally
### 3.1 Install
```bash
npm install
3.2 Environment
Create .env in project root:

PORT=3000
MONGODB_URI=
SESSION_SECRET=
3.3 Start
node cmd/server.js
Open:

http://localhost:3000/landing.html

Admin panel: http://localhost:3000/admin/admin.html

4) System Architecture (Data Flow)
Backend

cmd/server.js creates Express app, connects DB, sets middleware, serves static UI, mounts routers.

internal/db/db.js connects to MongoDB and provides initialized collections.

internal/controllers/* contain business logic (DB operations).

internal/routes/* map HTTP endpoints to controller methods.

internal/middleware/auth.js protects endpoints (requireAuth/requireAdmin).

Frontend

Static UI served from ui/public.

ui/public/script/script.js calls REST API via fetch (movies/tv/likes/comments).

ui/admin/admin.js calls admin API endpoints and renders results.

5) Database Documentation
Database: CinemaLibrary

5.1 Collections
users
Stores user accounts and roles.
Example document:

{
  _id: ObjectId,
  name: "Alisher",
  email: "a@b.com",
  passwordHash: "...",
  role: 0 // 0=user, 1=admin
  recoveryKeyHash: "..."
}
movies
{
  _id: ObjectId,
  title: "Fight Club",
  poster: "https://...",
  description: "...",
  genre: "Drama",
  duration: "2h 19m",
  iframe: "https://..."
  comments: embeded
    _id: ObjectId,
    userId: "",
    userName: "",
    text: "",
    createdAt: "0000-00-08T00:00:00.000+00:00"
}
tv-series
{
  _id: ObjectId,
  title: "Some TV Series",
  poster: "https://...",
  season: "1",
  episode: "3",
  description: "...",
  genre: "Action",
  duration: "45m",
  iframe: "https://..."
  comments: embeded
    _id: ObjectId,
    userId: "",
    userName: "",
    text: "",
    createdAt: "0000-00-08T00:00:00.000+00:00"
}
liked
Referenced model (user -> content). One like = one document.

{
  _id: ObjectId,
  userId: "sessionUserId",
  itemId: "movieOrTvId",
  type: "movie" | "tv"
}

5.2 Data Modeling Notes
Movies/TV are separate collections (different fields: season/episode).

Likes/comments reference content via itemId + type and reference author via userId.

Authorization rule: users can edit/delete only their own comments; admin can manage content.

6) Indexing & Optimization (Compound Index)
6.1 Compound index for liked (prevents duplicate likes and speeds queries)
await likeCollection.createIndex(
    { userId: 1, itemId: 1 },
    { unique: true }
)
Why:

Fast loading liked items

Guarantees no duplicate likes per user/item/type.

7) MongoDB Aggregation Endpoint
7.1 Endpoint: Top liked content
GET /api/stats/overview (admin only)

Aggregation pipeline groups likes by {itemId, type}, counts likes, sorts and returns Top 5:

liked.aggregate([
  { $group: { _id: { itemId: "$itemId", type: "$type" }, likes: { $sum: 1 } } },
  { $sort: { likes: -1 } },
  { $limit: 5 }
])

8) API Documentation (Endpoints + examples)
Base URL: /api

Auth
POST /signup
Body:

{ "name": "User", "email": "u@u.com", "password": "123" }
Response: redirects or { ok: true } depending on implementation.

POST /login
Body:

{ "email": "u@u.com", "password": "123" }
POST /logout
GET /me
Response:

{ "loggedIn": true, "id": "...", "name": "User", "role": 0 }
Content
GET /movies
GET /tv-series
GET /movies/watch?id=<id>
GET /tvSeries/watch?id=<id>
POST /search
Body:

{ "title": "Fight Club" }
Response: redirect to /watch.html?id=...&type=movie|tv

Likes (auth required)
POST /like
Body:

{ "id": "<itemId>", "type": "movie" }
Response:

{ "liked": true }
GET /liked
Response:

[ { "itemId": "...", "type": "movie", "userId": "..." } ]
Comments (auth required)
GET /comments?itemId=<id>&type=movie|tv
POST /comments
Body:

{ "itemId": "<id>", "type": "movie", "text": "Nice!" }
PUT /comments/:commentId (only author)
DELETE /comments/:commentId (only author)
Admin (admin only)
Prefix: /api/admin

POST /select

POST /insert (movie)

POST /inserttv (tv)

PUT /update (movie)

PUT /updatetv (tv)

DELETE /delete

Stats (admin only)
GET /stats/overview
Response:

{
  "totals": { "movies": 10, "tvSeries": 5, "users": 3, "likes": 20 },
  "topLiked": [
    { "_id": { "itemId": "...", "type": "movie" }, "likes": 7 }
  ]
}
9) UI Pages
landing.html — start page

login.html — login

signup.html — signup

logout.html — logout

recover.html — recover the forgot password

reset.html — reset the forgot password 

404.html — a 404 error page for unkown routes

main.html — content feed (movies/tv + favourites)

watch.html — player + comments + like button

admin/admin.html — admin panel (CRUD + stats)

also other non-essential html pagse such as contact.html 

10) Security Notes
Passwords are stored hashed (bcrypt).

Protected endpoints require session (requireAuth).

Admin-only endpoints are protected by role middleware (requireAdmin).

Users can modify only their own comments.

11) Author
Alisher 
