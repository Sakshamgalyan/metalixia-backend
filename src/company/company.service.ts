import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Company, CompanyDocument } from './entities/company.schema';
import { CreateCompanyDto } from 'src/dto/company/create-company.dto';
import { UpdateCompanyDto } from 'src/dto/company/update-company.dto';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
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

  async getCompanies(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
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
    return buildPaginatedResponse(data, total, page, limit);
  }

  async getCompaniesList(): Promise<{ value: string; label: string }[]> {
    const companies = await this.companyModel
      .find({ isActive: true })
      .select('companyName')
      .exec();
    return companies.map((company: any) => ({
      value: company._id.toString(),
      label: company.companyName,
    }));
  }

  async deleteCompany(id: string): Promise<Company> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid company ID');
    }
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
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel
      .findByIdAndUpdate(id, updateCompanyDto, { new: true })
      .exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async getCompanyParts(
    companyId: string,
  ): Promise<{ value: string; label: string }[]> {
    if (!isValidObjectId(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel.findById(companyId).exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company.parts
      .filter((part: any) => part.isActive === true)
      .map((part: any) => ({
        value: part._id.toString(),
        label: `${part.partNumber} - ${part.partName}`,
      }));
  }

  async addPartToCompany(companyId: string, part: any): Promise<Company> {
    if (!isValidObjectId(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    company.parts.push(part);
    return company.save();
  }

  async removePart(partId: string): Promise<Company> {
    if (!isValidObjectId(partId)) {
      throw new BadRequestException('Invalid part ID');
    }
    const company = await this.companyModel
      .findOne({ 'parts._id': partId })
      .exec();

    if (!company) {
      throw new NotFoundException('Part not found');
    }

    company.parts = company.parts.filter(
      (p: any) => p._id.toString() !== partId,
    );
    return await company.save();
  }

  async updatePart(partId: string, partData: any): Promise<Company> {
    if (!isValidObjectId(partId)) {
      throw new BadRequestException('Invalid part ID');
    }
    const company = await this.companyModel
      .findOne({ 'parts._id': partId })
      .exec();
    if (!company) {
      throw new NotFoundException('Part not found');
    }

    // Check if the part should be moved to a different company
    if (partData.companyId && partData.companyId !== company._id.toString()) {
      // Find new company
      const newCompany = await this.companyModel
        .findById(partData.companyId)
        .exec();
      if (!newCompany) throw new NotFoundException('New company not found');

      // Remove from old company
      const partObj = company.parts.find(
        (p: any) => p._id.toString() === partId,
      );
      company.parts = company.parts.filter(
        (p: any) => p._id.toString() !== partId,
      );
      await company.save();

      // Update and add to new company
      const updatedPart = { ...partObj, ...partData };
      delete updatedPart.companyId; // Do not store companyId inside the nested part
      newCompany.parts.push(updatedPart);
      return newCompany.save();
    } else {
      // Just update it in the existing company
      const partToUpdate = company.parts.find(
        (p: any) => p._id.toString() === partId,
      );
      if (partToUpdate) {
        if (partData.partName) partToUpdate.partName = partData.partName;
        if (partData.partNumber) partToUpdate.partNumber = partData.partNumber;
        if (partData.description !== undefined)
          partToUpdate.description = partData.description;
      }
      return company.save();
    }
  }

  async getAllParts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ) {
    const companies = await this.companyModel.find().lean().exec();

    if (!companies.length) {
      return {
        totalCount: 0,
        totalPages: 0,
        currentPage: Number(page),
        data: [],
      };
    }

    // Flatten and filter parts
    let allParts = companies.reduce((acc: any[], company: any) => {
      if (company.parts && Array.isArray(company.parts)) {
        let companyParts = company.parts.map((p: any) => ({
          ...p,
          companyId: company._id,
          companyName: company.companyName,
        }));

        // Filter by status if provided
        if (status === 'active') {
          companyParts = companyParts.filter((p: any) => p.isActive === true);
        } else if (status === 'inactive') {
          companyParts = companyParts.filter((p: any) => p.isActive === false);
        }

        return acc.concat(companyParts);
      }
      return acc;
    }, []);

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allParts = allParts.filter((part: any) => {
        return (
          part.partName?.toLowerCase().includes(searchLower) ||
          part.partNumber?.toLowerCase().includes(searchLower) ||
          part.companyName?.toLowerCase().includes(searchLower) ||
          part.description?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by latest added first
    allParts.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Pagination logic
    const totalCount = allParts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Number(page);

    const startIndex = (currentPage - 1) * limit;
    const paginatedData = allParts.slice(
      startIndex,
      startIndex + Number(limit),
    );

    return {
      totalCount,
      totalPages,
      currentPage,
      data: paginatedData,
    };
  }

  async toggleCompanyStatus(id: string): Promise<Company> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel.findById(id).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    company.isActive = !company.isActive;
    return company.save();
  }

  async togglePartStatus(partId: string): Promise<Company> {
    if (!isValidObjectId(partId)) {
      throw new BadRequestException('Invalid part ID');
    }
    const company = await this.companyModel
      .findOne({ 'parts._id': partId })
      .exec();
    if (!company) {
      throw new NotFoundException('Part not found');
    }
    const part = company.parts.find((p: any) => p._id.toString() === partId);
    if (part) {
      part.isActive = !part.isActive;
    }
    return company.save();
  }
}
