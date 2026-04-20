import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './entities/company.schema';
import { CreateCompanyDto } from 'src/dto/company/create-company.dto';

@Injectable()
export class CompanyService {
    constructor(
        @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    ) { }

    async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
        const createdCompany = new this.companyModel(createCompanyDto);
        return createdCompany.save();
    }

    async getCompanies(page: number, limit: number, search?: string) {
        const skip = (page - 1) * limit;
        const filter: any = {};
        if (search) {
            filter.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [data, total] = await Promise.all([
            this.companyModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.companyModel.countDocuments(filter).exec()
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}
