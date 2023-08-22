import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';

const UserMockService = {
  findAll: () => {
    return 'find mock users';
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}

// provider
// userValue / userClass / uesFactory
/*
    {
      provide: UserService,
      useValue: UserMockService,
    }
*/