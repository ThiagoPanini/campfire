from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from campfire.application.dto import RegisterRepertoireEntryCommand, RepertoireEntryView
from campfire.domain.exceptions import DuplicateRepertoireEntryError, UserNotFoundError
from campfire.interfaces.api.dependencies import ContainerDep, CurrentUser
from campfire.interfaces.api.v1.schemas import (
    RegisterRepertoireEntryRequest,
    RepertoireEntryResponse,
)

router = APIRouter(prefix="/repertoire", tags=["repertoire"])


def _entry_response(view: RepertoireEntryView) -> RepertoireEntryResponse:
    return RepertoireEntryResponse(
        entry_id=view.entry_id,
        user_id=view.user_id,
        song_id=view.song_id,
        song_title=view.song_title,
        song_artist=view.song_artist,
        instrument=view.instrument,
        proficiency=view.proficiency_score,
        proficiency_label=view.proficiency_label,
    )


@router.post(
    "",
    response_model=RepertoireEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_entry(
    payload: RegisterRepertoireEntryRequest,
    current_user: CurrentUser,
    container: ContainerDep,
) -> RepertoireEntryResponse:
    command = RegisterRepertoireEntryCommand(
        user_id=current_user.id,
        song_title=payload.song_title,
        song_artist=payload.song_artist,
        instrument_name=payload.instrument,
        proficiency_score=payload.proficiency,
    )
    try:
        view = container.register_repertoire_entry.execute(command)
    except DuplicateRepertoireEntryError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return _entry_response(view)


@router.get("/me", response_model=list[RepertoireEntryResponse])
def list_my_repertoire(
    current_user: CurrentUser,
    container: ContainerDep,
) -> list[RepertoireEntryResponse]:
    try:
        views = container.list_user_repertoire.execute(current_user.id)
    except UserNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return [_entry_response(v) for v in views]
