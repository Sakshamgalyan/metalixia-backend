import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyMaterialDocument = CompanyMaterial & Document;

@Schema({ timestamps: { createdAt: 'receivedAt', updatedAt: 'updatedAt' } })
export class CompanyMaterial {
    @Prop({ required: true })
    materialName: string;

    @Prop({ required: true })
    companyName: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    unit: string;

    @Prop({ required: true })
    receivedBy: string;

    @Prop({ required: true })
    receivedById: string;

    @Prop({ required: true })
    inventoryLocation: string;

    @Prop()
    receivedAt: Date;

    @Prop()
    updatedAt: Date;
}

export const CompanyMaterialSchema = SchemaFactory.createForClass(CompanyMaterial);
