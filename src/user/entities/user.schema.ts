import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/dto/Role/Role.dto';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  post: string;

  @Prop({ required: true, unique: true })
  mobileNo: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: Role.USER })
  role: string;

  @Prop({ unique: true })
  employeeId: string;

  @Prop()
  refreshToken: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  profilePicture: string;

  @Prop({ default: 'Employee of Metalixia' })
  description: string;

  @Prop()
  address: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
