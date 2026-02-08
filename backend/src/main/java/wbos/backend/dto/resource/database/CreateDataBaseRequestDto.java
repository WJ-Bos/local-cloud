package wbos.backend.dto.resource.database;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * DTO for database creation requests
 *
 * Inherits common validation rules from DatabaseRequestDto.
 * Can be extended with create-specific fields if needed.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CreateDataBaseRequestDto extends DatabaseRequestDto {
    // All fields are inherited from DatabaseRequestDto
    // Add create-specific fields here if needed in the future
}
