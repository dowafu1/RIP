class AppError(Exception):
    status_code = 400
    detail = "Request could not be processed"


class EmailAlreadyRegisteredError(AppError):
    status_code = 409
    detail = "Email уже зарегистрирован"


class InvalidCredentialsError(AppError):
    status_code = 401
    detail = "Неверный email или пароль"


class TaskNotFoundError(AppError):
    status_code = 404
    detail = "Задача не найдена"
