import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './entity/enrollment.entity';
import { Assesment } from './entity/assesment.entity';
import { Benefit } from './entity/benefit.entity';

@Module({
    //imports: [TypeOrmModule.forFeature([Enrollment, Assesment, Benefit])],
    //providers: [UsersService],
    //exports: [UsersService]
})
export class UsersModule { }
