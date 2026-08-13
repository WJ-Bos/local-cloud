package wbos.backend.dto.resource.instance;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * DTO for instance launch requests
 *
 * Inherits common validation rules from InstanceRequestDto.
 * Can be extended with launch-specific fields if needed.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CreateInstanceRequestDto extends InstanceRequestDto {
}
