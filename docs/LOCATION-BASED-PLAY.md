# Location-based play

Status: implementation authorized by Pierre on 2026-11-15, including the shared API and Sarah's report files. Branch: `pierre/location-based-play`, based on `main` after pull request 24.

## Behavior

- Ask for location when joining. Assign the neighborhood from the player's current position instead of showing a neighborhood picker.
- Allow joining only inside the supported Tempe play area. A visitor who is physically there can play; location does not establish residency.
- Require a fresh location reading when submitting a report. Use that position for the report, without an arbitrary map pin or manual fallback.
- If location is denied, unavailable, too imprecise or outside the play area, explain the issue and offer a retry. Do not award report points.
- Keep the public board available to visitors without requesting location.
- Do not track players in the background or save their joining coordinates. Only submitted reports have public coordinates.

## Contract change

Both joining and report submission now require this device reading:

```diff
+ interface LocationFix {
+   lat: number;
+   lng: number;
+   accuracyMeters: number;
+   capturedAt: string; // ISO timestamp
+ }

  interface CreatePlayerRequest {
    nickname: string;
-   neighborhood: NeighborhoodId;
+   location: LocationFix;
  }

  interface SubmitReportRequest {
    playerId: string;
-   lat: number;
-   lng: number;
+   location: LocationFix;
    category?: Category;
  }
```

Response and stored-player shapes are unchanged. The server assigns `Player.neighborhood` and derives report coordinates from the submitted location. Coordinates, accuracy, freshness and membership in the supported play area are checked before publishing a report or awarding points. Errors use the existing standard shape.

## Implementation

| Area | Changes |
| --- | --- |
| `shared/api.ts`, `shared/types.ts` | Add `LocationFix` and update both request types. |
| `shared/location.ts`, `shared/playArea.ts` | Validate readings, check Tempe's published polygon and assign the game neighborhood. Share the same checks with mock mode. |
| `shared/tempeBoundary.ts`, `api/scripts/city-boundary.ts` | A checked copy of the City's boundary, used when the live one cannot be loaded, and the script that makes it (`npm run city-boundary` in `api/`). |
| `web/src/app/location.ts` | Read the device's position for one action, waiting up to 12 seconds for a reading that is precise enough. |
| `web/src/features/players/JoinScreen.tsx`, `api/src/players/` | Request location, show the assigned neighborhood and validate the assignment on the server. |
| `web/src/features/quests/ReportScreen.tsx` | Remove `LocationPicker.tsx` and replace arbitrary pin placement with a required current location and retry states. |
| `api/src/quests/schemas.ts`, `reportRoutes.ts` | Validate location before report publication, point awards or deal unlocks. |
| `web/src/app/mock/`, `strings.ts`, `legal/content.ts` | Update fixtures (mock mode runs the same location checks), messages and the location disclosure. `web/src/app/api.ts` needs no change: it passes the typed request bodies through. |

## Settings and existing players

- Maximum location age: 60 seconds; maximum future clock difference: 10 seconds. The app checks this on the device's own clock.
- The server allows a further 2 minutes either way, because the reading's time is stamped by the device and device clocks differ from the server's. Without that, a phone running 15 seconds fast was refused every time and retrying never helped. Beyond the allowance the message says the device's clock looks wrong. The time was never proof of anything: a modified client can send any time it likes.
- Maximum reported accuracy radius: 100 meters for a report, which is pinned at the reading, and 500 meters for joining, where the reading only picks a team. A laptop on Wi-Fi often reports a few hundred meters.
- The browser must request a new reading for each action. It listens for up to 12 seconds and takes the first reading that is fresh and precise enough, because a phone's first reading is often a rough one from cell towers or Wi-Fi. The listening stops with the action, and nothing is kept.
- Existing players keep their neighborhood and earned points. Every new report still requires a fresh location inside Tempe. Teams remain fixed when a player travels within the city; lifetime points are not moved between teams.
- The City boundary is fetched from [Tempe's City Boundary feature layer](https://services.arcgis.com/lQySeXwbBg53XWDi/ArcGIS/rest/services/City_Boundary/FeatureServer/0). The query downloads the full polygon in WGS84 without transmitting player coordinates. A valid boundary is cached for 24 hours per API process (or browser tab in mock mode). If a download fails, the last boundary downloaded remains usable, and a process that has none uses the copy bundled with the code (`shared/tempeBoundary.ts`, which says what day it was copied). After a failure the City is asked again five minutes later, not on every request. The API logs one `playArea` warning line each time it cannot load the live boundary. Run `npm run city-boundary` in `api/` to refresh the copy if Tempe's limits change.
- No new packages or cloud resources are required. Device readings are not stored on player records. Report coordinates remain public as before.

The four team names describe demo game zones, not official neighborhood boundaries. All zones are clipped to the City polygon first; a nearby point outside Tempe never receives a team.

| Assignment order | Game zone |
| --- | --- |
| 1: ASU Campus | Latitude 33.413 to 33.434; longitude -111.940 to -111.925. |
| 2: Downtown Tempe | Latitude 33.414 to 33.435; longitude -111.956 to -111.940, excluding points already assigned to ASU. |
| 3: North Tempe | Remaining city area at or north of latitude 33.435. |
| 4: South Tempe | Remaining city area south of latitude 33.435. |

The explicit zone edges live in `shared/location.ts` and can be adjusted without changing player or report fields.

## Acceptance checks

- Each supported neighborhood resolves correctly, including boundaries and overlap rules.
- A location outside the play area never creates a player or awards report points.
- Denied permission, stale readings, poor accuracy and timeouts provide a clear retry state.
- A rough first reading followed by a precise one succeeds without the player retrying.
- A laptop reporting a few hundred meters of accuracy can join, and cannot submit a report.
- With the City's boundary service unreachable, joining and reporting still work and a point outside Tempe is still refused.
- A report cannot be placed at an arbitrary location through the normal interface.
- Server validation rejects missing, invalid, stale and out-of-area location inputs before publication or awards.
- Existing players cannot bypass the location requirement by keeping their saved player ID.
- Joining coordinates are not persisted, and the board remains accessible without location.
- Package checks pass; the join and report flows work at 375 px wide.

Browser location is supplied by the device and can be spoofed. These checks prevent ordinary remote pin placement; they cannot prove physical presence against a modified client.

## Validation

Checked on 2026-11-15 on this branch:

- `npm run check` and `npm run build` pass in `web/` (67 tests) and `api/` (159 tests). Location tests use synthetic boundary geometry, the bundled copy of the boundary and mocked side effects; they do not send AWS requests, Gemini requests or Solana transactions.
- The bundled copy of the boundary and the City's live one gave the same answer at every one of 10,100 grid points over the Tempe area. With the City's service made unreachable, the real lookup still placed a point at Sun Devil Stadium and refused Phoenix, and it tried the dead service once across those 10,100 lookups.
- With the API's clock allowance, a reading stamped 15 seconds ahead or 90 seconds behind is accepted, and one 5 minutes ahead gets the message about the device's clock. A 300 m reading can join and cannot report; 600 m can do neither.
- In mock mode at 375 px, with the device replaced by a stand-in that gives a rough reading first: joining succeeded on the first tap once a reading within 500 m arrived. A report with only 300 m readings was refused when the 12 seconds ran out, with a retry and no points; the retry succeeded when a 40 m reading followed a 900 m one. Each wait stopped listening when it ended.
- The live City boundary answers the query in `shared/playArea.ts` (HTTP 200, one feature named "Tempe", 6 rings, 602 points, WGS84, no transfer limit). The real lookup run against it accepted fixed test points at Sun Devil Stadium (ASU Campus), Tempe Marketplace (South Tempe) and west of Mill Ave on Tempe Town Lake (Downtown Tempe), and refused Phoenix downtown, Phoenix Sky Harbor, Scottsdale, Mesa and Chandler. On a grid over the area, all four teams were reachable. A reading two minutes old and one with 500 m accuracy were refused. The first lookup, which downloads the boundary, took about 0.3 seconds.
- In mock mode in a 375 px wide browser, with the device reading replaced by a test stand-in: joining from outside Tempe or with permission blocked shows a message and creates no player; joining at the stadium assigns ASU Campus. A report submitted from outside Tempe is refused with a retry and no points; after moving into Tempe and retrying, it earns 50 points and shows the reading's coordinates. Each attempt asked for a new reading. There is no sideways scroll and every tap target is at least 44 px. The browser fetched the City boundary directly, so its CORS settings work. No screenshot was taken: the pane was hidden.

Not checked:

- A real phone: the browser's own location prompt, real GPS accuracy and timestamps, how long a precise reading really takes to arrive, and the denied-permission and retry flow on iOS Safari and Android Chrome.
- A real laptop: whether its Wi-Fi reading falls inside the 500 m limit for joining.
- The deployed API reaching the City boundary from AWS Lambda.
- Anything with real players, existing saved player IDs, or the real database.

The frontend and API request changes are not compatible with the previous versions of each other, so they need to be released together.
