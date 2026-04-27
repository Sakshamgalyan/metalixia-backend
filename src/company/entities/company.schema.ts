import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PartItem {
  @Prop()
  partName: string;

  @Prop()
  partNumber: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isActive: boolean;
}
export const PartItemSchema = SchemaFactory.createForClass(PartItem);

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  companyName: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  contactPerson: string;

  @Prop({ type: [PartItemSchema], default: [] })
  parts: (PartItem & { _id: Types.ObjectId })[];

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
