import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PartItem {
 
  @Prop()
  companyId: string;

  @Prop()
  partName: string;

  @Prop()
  partNumber: string;

  @Prop()
  description: string;
}
export const PartItemSchema = SchemaFactory.createForClass(PartItem);

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {

  @Prop({ required: true })
  companyId: string;

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
}

export const CompanySchema = SchemaFactory.createForClass(Company);
