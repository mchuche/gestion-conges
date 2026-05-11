import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Garde les routes qui exigent un access JWT valide (Authorization: Bearer …).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
