from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import TaskNotFoundError
from app.models import Task
from app.schemas.task import TaskCreate, TaskUpdate


async def list_tasks(db: AsyncSession, user_id: int) -> list[Task]:
    result = await db.scalars(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.created_at.desc(), Task.id.desc())
    )
    return list(result)


async def get_task(db: AsyncSession, user_id: int, task_id: int) -> Task:
    task = await db.scalar(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    if task is None:
        raise TaskNotFoundError
    return task


async def create_task(db: AsyncSession, user_id: int, payload: TaskCreate) -> Task:
    task = Task(
        title=payload.title,
        description=payload.description,
        user_id=user_id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task(
    db: AsyncSession,
    user_id: int,
    task_id: int,
    payload: TaskUpdate,
) -> Task:
    task = await get_task(db, user_id, task_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


async def toggle_task(db: AsyncSession, user_id: int, task_id: int) -> Task:
    task = await get_task(db, user_id, task_id)
    task.completed = not task.completed
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, user_id: int, task_id: int) -> None:
    task = await get_task(db, user_id, task_id)
    await db.delete(task)
    await db.commit()
