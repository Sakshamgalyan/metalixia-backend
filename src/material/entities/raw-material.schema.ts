import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RawMaterialDocument = RawMaterial & Document;

@Schema({ timestamps: { createdAt: 'receivedAt', updatedAt: 'updatedAt' } })
export class RawMaterial {
    @Prop({ required: true })
    materialName: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    unit: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    source: string;

    @Prop({ required: true })
    inventoryLocation: string;

    @Prop({ required: true })
    invoiceNumber: string;

    @Prop({ required: true })
    receivedBy: string;

    @Prop({ required: true })
    receivedById: string;

    @Prop({ type: Date, required: true })
    expectedOn: Date;

    @Prop()
    receivedAt: Date;

    @Prop()
    updatedAt: Date;
}

export const RawMaterialSchema = SchemaFactory.createForClass(RawMaterial);
