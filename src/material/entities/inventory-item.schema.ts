import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryItemDocument = InventoryItem & Document;

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({ required: true, enum: ['company', 'raw'] })
  sourceType: string;

  @Prop({ required: true })
  sourceId: string;

  @Prop({ required: true })
  materialName: string;

  @Prop()
  partName: string;

  @Prop()
  partNumber: string;

  @Prop()
  companyName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  originalQuantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  inventoryLocation: string;

  @Prop({ default: 0 })
  minStock: number;

  @Prop({
    default: 'received',
    enum: [
      'received',
      'in_production',
      'quality_check',
      'ready_for_dispatch',
      'dispatched',
      'consumed',
    ],
  })
  status: string;

  @Prop({ type: Date })
  receivedAt: Date;

  @Prop()
  receivedBy: string;

  @Prop()
  receivedById: string;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);
