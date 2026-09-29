# Assumptions

The challenge leaves several points open. Each one is recorded below with the
decision taken and the reason for it.

## A. Authentication

**A1. Fixed credentials.** A single user is created by the database seed, with the
password stored as a bcrypt hash. Email and password come from environment variables;
`.env.example` ships test values, documented in the README. The evaluator can log in
without asking, and no password lives in plain text in the code.

**A2. Token storage.** The session is a JWT in an `httpOnly` cookie with
`SameSite=Strict`. Page scripts cannot read the token, which closes token theft
through XSS.

**A3. Logout.** Logout clears the cookie, and tokens are short-lived (1 hour). A
stateless JWT cannot be revoked on the server; the short lifetime bounds the exposure
of a token copied before logout.

**A4. Data ownership.** Every machine belongs to a user, and every query filters by
the authenticated user. This makes "my monitoring points" literal and keeps one user
from reaching another user's data.

## B. Machines, monitoring points and sensors

**B1. "At least two monitoring points".** A machine accepts any number of monitoring
points, and no minimum is enforced at creation. The sentence describes a capability,
not a rule; enforcing a minimum would block step-by-step registration.

**B2. Unique names.** A machine name is unique per user, and a monitoring point name is
unique per machine. Two identical names in the list would be indistinguishable.

**B3. Point and sensor.** A monitoring point has at most one sensor, and a sensor sits
on exactly one monitoring point, as a physical sensor is mounted at one location.

**B4. Sensor unique ID.** The sensor ID is provided by the user, like a serial number,
and is unique across the whole system, enforced by a unique index. The internal
primary key is separate.

**B5. Changing a machine type.** Changing a machine to `Pump` is rejected with `409`
when any of its monitoring points has a `TcAg` or `TcAs` sensor, and the error lists
those points. Accepting the change would leave invalid data in the database.

**B6. Deleting a machine.** Deletion cascades to monitoring points, sensors and
time-series. The interface asks for confirmation and shows what will be removed, so
nothing disappears silently.

**B7. Monitoring point without a sensor.** It is listed with an empty sensor model
("No sensor"), and empty values sort last. Hiding the point would suggest it does not
exist.

**B8. Pagination and sorting.** Pagination and sorting run on the server, 5 items per
page, by any column, always with a tiebreaker on the primary key so items never skip or
repeat between pages.

## C. Time-series

**C1. What a time-series is.** A time-series is an entity of its own: it belongs to a
sensor, has a name, a quantity and a unit, and holds readings `(timestamp, value)`.
Counting, deleting and retrieving a full time-series only make sense if a series is a
countable thing.

**C2. Owner of a time-series.** A time-series belongs to a sensor, since the challenge
speaks of "raw sensor data" and of metrics "for my sensors".

**C3. Input format.** Readings are sent as JSON, a list of `{ timestamp, value }` with
timestamps in ISO 8601 UTC. CSV upload is left as an extension.

**C4. Invalid readings.** A batch with any invalid reading is rejected as a whole with
`422`, stating the index and the reason of each invalid reading. Partial acceptance
would hide the loss.

**C5. Repeated timestamps.** A timestamp is unique within a series, enforced by the
database. Sending the same reading again does not duplicate it.

**C6. Metrics.** Count, minimum, maximum, mean, standard deviation, RMS, and first and
last timestamps, computed in the database. RMS is the metric that matters for
vibration; computing in the database keeps the latency budget.

**C7. Empty series.** Metrics come back as `null`, with a count of zero. Null means
"unknown"; zero would claim a measurement that never happened.

**C8. Size limits.** Each request accepts up to 10,000 readings, and each series has a
maximum size. The limits are explicit, and the error states which one was exceeded.
They are what makes the latency target a promise rather than a hope.

## D. Non-functional requirements

**D1. Latency below 350 ms.** Measured as API response time in a local environment,
with realistic data volumes, through a load test. Every published number states how it
was obtained.

**D2. Unit tests.** Business rules are unit tested on both frontend and backend, and
the API has integration tests against a real database. The `Pump` rule is tested to
prove that both the API and the database reject invalid data, not only that valid data
passes.
