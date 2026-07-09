import { IsIn } from 'class-validator';
import type { ChangeVisibilityDto, Visibilita } from '@homedocs/shared-types';

export class ChangeVisibilityInputDto implements ChangeVisibilityDto {
  @IsIn(['privato', 'condiviso'])
  visibilita: Visibilita;
}
