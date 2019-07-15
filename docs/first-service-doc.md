# `firstService`

`firstService` helps you to create complex `requestToResponse`.
It works like this:

1. It accepts 0 or more function.<br />
2. Set `serviceCandidate` to the first function<br />
3. Calls `serviceCandidate` and __awaits__ its `return value`.<br />
4. If `return value` is a non null object it is returned.<br />
   Otherwise, set `serviceCandidate` to the next function and go to step 3
