import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyMaterialDocument = CompanyMaterial & Document;

@Schema({ timestamps: true })
export class CompanyMaterial {
  @Prop({ required: true })
  partName: string;

  @Prop({ required: true })
  partNumber: string;

  @Prop({ required: true })
  partId: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  companyId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ default: null })
  receivedBy: string;

  @Prop({ default: null })
  receivedById: string;

  @Prop({ required: true })
  inventoryLocation: string;

  @Prop({ type: Date, default: null })
  expectedOn: Date;

  @Prop({ type: Date, default: null })
  deliveryBy: Date;

  @Prop({ type: Date, default: null })
  receivedOn: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CompanyMaterialSchema =
  SchemaFactory.createForClass(CompanyMaterial);
