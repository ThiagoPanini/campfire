from __future__ import annotations


class RepertoireError(Exception):
    pass


class InstrumentUnknown(RepertoireError):
    def __init__(self, instrument: str) -> None:
        super().__init__(f"unknown instrument: {instrument!r}")
        self.instrument = instrument


class ProficiencyUnknown(RepertoireError):
    def __init__(self, proficiency: str) -> None:
        super().__init__(f"unknown proficiency: {proficiency!r}")
        self.proficiency = proficiency


class SearchQueryTooShort(RepertoireError):
    pass


class EntryNotFound(RepertoireError):
    pass


class EntryForbidden(RepertoireError):
    pass


class DuplicateEntry(RepertoireError):
    pass


class SongCatalogUnavailable(RepertoireError):
    pass


class SongCatalogRateLimited(RepertoireError):
    pass


class SearchRateLimited(RepertoireError):
    def __init__(self, retry_after: int = 60) -> None:
        super().__init__(f"search rate limit exceeded; retry after {retry_after}s")
        self.retry_after = retry_after
