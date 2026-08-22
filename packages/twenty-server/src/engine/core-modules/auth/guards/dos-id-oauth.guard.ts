import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DosIdOauthGuard extends AuthGuard('dos-id') {}
