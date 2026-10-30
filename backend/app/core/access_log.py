import logging


class AccessLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not isinstance(record.args, tuple):
            return True

        args = record.args

        if "WebSocket" in str(record.msg) and len(args) >= 2:
            record.args = (args[0], str(args[1]).split("?", 1)[0])
            return True

        if (
            len(args) >= 3
            and str(args[1]) == "GET"
            and str(args[2]).split("?", 1)[0] == "/api/health"
        ):
            return False

        return True


def install_access_log_filter() -> None:
    for logger_name in ("uvicorn.access", "uvicorn.error"):
        logger = logging.getLogger(logger_name)
        if not any(
            isinstance(existing, AccessLogFilter) for existing in logger.filters
        ):
            logger.addFilter(AccessLogFilter())
