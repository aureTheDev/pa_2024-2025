from pydantic import BaseModel, model_validator, ConfigDict


class MyBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def trim_and_validate_strings(cls, values):
        for field_name, field in cls.model_fields.items():
            # On vérifie que la valeur existe et est une chaîne
            if field.annotation is str and field_name in values:
                value = values[field_name]
                if isinstance(value, str):
                    trimmed_value = value.strip()
                    if trimmed_value == "":
                        raise ValueError(
                            f"Le champ '{field_name}' ne peut pas être composé uniquement d'espaces."
                        )
                    values[field_name] = trimmed_value
        return values

