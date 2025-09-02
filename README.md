# Archon Multi-Agent Team

This project defines a hierarchical team of AI agents for software development using Pydantic. The structure is based on the "Archon" concept of a single ruling entity (the Project Manager) that coordinates a team of specialized agents.

## Structure

- **Project Manager (PM):** The central coordinator.
- **Team Members:** Specialized agents for Frontend, Backend, Database, Tests, and UI-Tests.

## Files

- `main.py`: Entry point to create and display the team structure.
- `agents/`: Python package containing all agent definitions.
  - `roles.py`: `AgentRole` enum.
  - `models.py`: Pydantic models for each agent.
  - `team.py`: The top-level `Team` model.
