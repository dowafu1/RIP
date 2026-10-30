from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser, DbSession
from app.models import Task
from app.realtime.manager import manager
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_payload(task: Task) -> dict:
    return TaskRead.model_validate(task).model_dump(mode="json")


@router.get("", response_model=list[TaskRead])
async def list_tasks(db: DbSession, current_user: CurrentUser) -> list[Task]:
    return await task_service.list_tasks(db, current_user.id)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> Task:
    task = await task_service.create_task(db, current_user.id, payload)
    await manager.broadcast(
        current_user.id,
        {"type": "task.created", "task": _task_payload(task)},
    )
    return task


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> Task:
    return await task_service.get_task(db, current_user.id, task_id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> Task:
    task = await task_service.update_task(db, current_user.id, task_id, payload)
    await manager.broadcast(
        current_user.id,
        {"type": "task.updated", "task": _task_payload(task)},
    )
    return task


@router.patch("/{task_id}/toggle", response_model=TaskRead)
async def toggle_task(
    task_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> Task:
    task = await task_service.toggle_task(db, current_user.id, task_id)
    await manager.broadcast(
        current_user.id,
        {"type": "task.updated", "task": _task_payload(task)},
    )
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> Response:
    await task_service.delete_task(db, current_user.id, task_id)
    await manager.broadcast(
        current_user.id,
        {"type": "task.deleted", "task_id": task_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
