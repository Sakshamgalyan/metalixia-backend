import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './entities/company.schema';
import { CreateCompanyDto } from 'src/dto/company/create-company.dto';
import { UpdateCompanyDto } from 'src/dto/company/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const existingCompany = await this.companyModel
      .findOne({
        companyName: createCompanyDto.companyName,
      })
      .exec();

    if (existingCompany) {
      throw new BadRequestException('Company with this name already exists');
    }
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
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.companyModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.companyModel.countDocuments(filter).exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteCompany(id: string): Promise<Company> {
    const company = await this.companyModel.findByIdAndDelete(id).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async updateCompany(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.companyModel
      .findByIdAndUpdate(id, updateCompanyDto, { new: true })
      .exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async getCompanyParts(companyId: string): Promise<Company> {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async addPartToCompany(companyId: string, part: any): Promise<Company> {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    company.parts.push(part);
    return company.save();
  }

  async removePart(partId: string): Promise<Company> {
    const company = await this.companyModel.findOne({ 'parts._id': partId }).exec();

    if (!company) {
      throw new NotFoundException('Part not found');
    }

    company.parts = company.parts.filter((p: any) => p._id.toString() !== partId);
    return await company.save();
  }

  async updatePart(partId: string, partData: any): Promise<Company> {
    const company = await this.companyModel.findOne({ 'parts._id': partId }).exec();
    if (!company) {
      throw new NotFoundException('Part not found');
    }
    
    // Check if the part should be moved to a different company
    if (partData.companyId && partData.companyId !== company._id.toString()) {
      // Find new company
      const newCompany = await this.companyModel.findById(partData.companyId).exec();
      if (!newCompany) throw new NotFoundException('New company not found');
      
      // Remove from old company
      const partObj = company.parts.find((p: any) => p._id.toString() === partId);
      company.parts = company.parts.filter((p: any) => p._id.toString() !== partId);
      await company.save();
      
      // Update and add to new company
      const updatedPart = { ...partObj, ...partData };
      delete updatedPart.companyId; // Do not store companyId inside the nested part
      newCompany.parts.push(updatedPart);
      return newCompany.save();
    } else {
      // Just update it in the existing company
      const partToUpdate = company.parts.find((p: any) => p._id.toString() === partId);
      if (partToUpdate) {
        if (partData.partName) partToUpdate.partName = partData.partName;
        if (partData.partNumber) partToUpdate.partNumber = partData.partNumber;
        if (partData.description !== undefined) partToUpdate.description = partData.description;
      }
      return company.save();
    }
  }
  async getAllParts(): Promise<Company[]> {
    const companies = await this.companyModel.find().exec();

    if (!companies.length) {
      throw new NotFoundException('No companies found');
    }

    return companies;
  }
}
