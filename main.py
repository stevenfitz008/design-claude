import json
from agents.team import create_development_team
from agents.models import Task
from agents.roles import AgentRole

def print_team_state(team, title):
    """Helper function to print the team state in a readable format."""
    print(f"\n--- {title} ---")
    print(team.model_dump_json(indent=2))

def main():
    """
    Demonstrates creating tasks with dependencies and the workflow of assigning and completing them.
    """
    team = create_development_team(project_name="Claude-Code Design Studio")

    # 1. Add tasks, including one with a dependency
    print("--- 1. Adding Tasks ---")
    backend_task = "Create User API"
    frontend_task = "Build User Profile Page"
    
    team.add_task(Task(title=backend_task, description="Develop a REST API for user data."))
    team.add_task(
        Task(
            title=frontend_task, 
            description="Create the UI to display user profiles.",
            dependencies=[backend_task]  # This task depends on the backend task
        )
    )
    print_team_state(team, "Initial State with Dependent Tasks")

    # 2. Attempt to assign the frontend task first (should fail)
    print("\n--- 2. Attempting to Assign Frontend Task (should fail) ---")
    team.assign_task(task_title=frontend_task, assignee_role=AgentRole.FRONTEND)
    print_team_state(team, "State After Failed Assignment")

    # 3. Assign and complete the backend task
    print("\n--- 3. Assigning and Completing Backend Prerequisite ---")
    team.assign_task(task_title=backend_task, assignee_role=AgentRole.BACKEND)
    team.complete_task(task_title=backend_task)
    print_team_state(team, "State After Completing Backend Task")

    # 4. Retry assigning the frontend task (should succeed)
    print("\n--- 4. Retrying Frontend Task Assignment (should succeed) ---")
    team.assign_task(task_title=frontend_task, assignee_role=AgentRole.FRONTEND)
    print_team_state(team, "State After Successful Frontend Assignment")

    # 5. Complete the frontend task
    print("\n--- 5. Completing Frontend Task ---")
    team.complete_task(task_title=frontend_task)
    print_team_state(team, "Final State")

if __name__ == "__main__":
    main()