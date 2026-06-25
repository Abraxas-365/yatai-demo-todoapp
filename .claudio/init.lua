-- Yatai harness: the system prompt as the default agent.
claudio.agents.register({
  name   = "yatai",
  tools  = "*",
  system = [[You are working on a software project.
The project repository has been cloned to /workspace/repo — this is your working directory.
Complete the assigned card. Save proof of your work to /workspace/proof/.

## Git workflow (IMPORTANT)
- Create a feature branch from main: git checkout -b card/<card-id-short>
- Make atomic commits with clear messages as you work
- When your implementation is complete and tests pass, push the branch:
    git push origin card/<card-id-short>
- The repo is already authenticated — git push will work directly
- Do NOT push to main. Always push to your feature branch.

## Card: Create basic HTML structure with Todo list layout
**ID:** 667c26a5-dc75-451c-983e-b0a1af8877b0
**Status:** IN_PROGRESS

### Description
Create an index.html file with a clean, modern Todo app layout. Include:
- Header with app title
- Input field for new todos
- Add button
- Todo list container
- Basic CSS styling inline or in a style tag
- Modern, clean UI design

### Acceptance Criteria
[
  "index.html file exists",
  "Has input field and add button",
  "Has todo list container",
  "Has modern CSS styling"
]

## PROOF REQUIREMENTS (MANDATORY)

You MUST provide proof that your implementation works. This is non-negotiable.
Save ALL proof to /workspace/proof/. These files will be attached to the card
for the reviewer and the team to see.

Accepted proof file types:
- Screenshots: .png, .jpg, .webp (for UI work)
- Videos: .mp4, .webm (for complex UI flows)
- Test output: .txt (verbose test runner output)
- API responses: .json (curl output)
- Logs: .txt (server logs showing successful startup/operation)

### Minimum required proof:
1. **Always**: test-output.txt with verbose test results (ALL tests passing)
2. **If UI exists**: at least 2 screenshots showing the feature working
3. **If API**: at least 1 .json file with a successful API response

If tests fail, fix the code and re-run until they pass.
Your work is NOT complete until proof files exist in /workspace/proof/.]],
})

claudio.setup({
  default_agent = "yatai",
})

-- Yatai KB tools: registered as native Claudio tools so the agent sees them
-- in its tool list alongside Read, Write, Bash, etc.

claudio.tools.register({
  name        = "ReadKB",
  description = "Read entries from the project knowledge base. Returns architecture decisions, status updates, and context from previous work. Call this at the START of your work to understand project context.",
  schema = [[{
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "description": "Optional category filter: architecture, decisions, status, general. Omit to read all entries.",
        "enum": ["architecture", "decisions", "status", "general"]
      }
    }
  }]],
  execute = function(input)
    local cat = input.category or ""
    if cat ~= "" then
      local h = io.popen("yatai-kb read " .. cat .. " 2>&1")
      local out = h:read("*a"); h:close(); return out
    else
      local h = io.popen("yatai-kb read 2>&1")
      local out = h:read("*a"); h:close(); return out
    end
  end,
})

claudio.tools.register({
  name        = "WriteKB",
  description = "Write an entry to the project knowledge base. Use this to record architecture decisions, implementation notes, status updates, or anything the next agent working on this project should know.",
  schema = [[{
    "type": "object",
    "properties": {
      "title":    { "type": "string", "description": "Short title for the entry" },
      "content":  { "type": "string", "description": "The content to record" },
      "category": {
        "type": "string",
        "description": "Entry category",
        "enum": ["architecture", "decisions", "status", "general"],
        "default": "status"
      }
    },
    "required": ["title", "content"]
  }]],
  execute = function(input)
    local title = input.title:gsub("'", "'\\''")
    local content = input.content:gsub("'", "'\\''")
    local cat = input.category or "status"
    local cmd = string.format("yatai-kb write --category '%s' '%s' '%s' 2>&1", cat, title, content)
    local h = io.popen(cmd)
    local out = h:read("*a"); h:close(); return out
  end,
})


-- Yatai event tools: AskHuman pauses the agent and waits for a human answer.
-- LogEvent records execution milestones visible in the card's execution feed.

claudio.tools.register({
  name        = "AskHuman",
  description = "Ask the human operator a question when you are uncertain or need a decision. The agent will pause until the human responds. Use sparingly — only when you genuinely cannot proceed without guidance.",
  schema = [[{
    "type": "object",
    "properties": {
      "question": {
        "type": "string",
        "description": "The question to ask the human operator"
      }
    },
    "required": ["question"]
  }]],
  execute = function(input)
    local q = input.question:gsub("'", "'\\''")
    -- Submit question
    local h = io.popen("yatai-evt ask '" .. q .. "' 2>&1")
    local resp = h:read("*a"); h:close()
    -- Poll for answer (check every 5 seconds, timeout after 30 minutes)
    local deadline = os.time() + 1800
    while os.time() < deadline do
      os.execute("sleep 5")
      local ph = io.popen("yatai-evt poll 2>&1")
      local pr = ph:read("*a"); ph:close()
      if pr:find('"status"%s*:%s*"answered"') then
        local answer = pr:match('"answer"%s*:%s*"([^"]*)"')
        if answer then return "Human answered: " .. answer end
      end
    end
    return "Timed out waiting for human response after 30 minutes. Proceed with your best judgment."
  end,
})

claudio.tools.register({
  name        = "LogEvent",
  description = "Log a milestone or status update visible in the card's execution feed. Use this to communicate progress: starting a phase, completing a step, encountering an issue.",
  schema = [[{
    "type": "object",
    "properties": {
      "event_type": {
        "type": "string",
        "description": "Type of event",
        "enum": ["log", "thinking", "error"]
      },
      "content": {
        "type": "string",
        "description": "Description of what happened or what you're doing"
      }
    },
    "required": ["event_type", "content"]
  }]],
  execute = function(input)
    local t = input.event_type or "log"
    local c = input.content:gsub("'", "'\\''")
    local h = io.popen("yatai-evt log '" .. t .. "' '" .. c .. "' 2>&1")
    local out = h:read("*a"); h:close(); return out
  end,
})
