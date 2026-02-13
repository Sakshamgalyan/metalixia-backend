import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payslip, PayslipDocument } from './entities/payslip.schema';
import { UserService } from 'src/user/user.service';
import * as fs from 'fs';
import { CreatePayslipDto } from 'src/dto/paySlip/create-payslip.dto';

@Injectable()
export class PayslipService {
  private readonly logger = new Logger(PayslipService.name);

  constructor(
    @InjectModel(Payslip.name) private payslipModel: Model<PayslipDocument>,
    private readonly userService: UserService,
  ) {}

  async create(file: Express.Multer.File, createPayslipDto: CreatePayslipDto) {
    this.logger.log(
      `Creating payslip for employee ${createPayslipDto.employeeId}, month: ${createPayslipDto.month}, year: ${createPayslipDto.year}`,
    );
    const newPayslip = new this.payslipModel({
      ...createPayslipDto,
      fileName: file.filename,
      location: file.path,
    });
    const result = await newPayslip.save();
    this.logger.log(
      `Payslip created successfully for employee ${createPayslipDto.employeeId}`,
    );
    return result;
  }

  async findAll(page: number = 1, limit: number = 10, employeeId?: string) {
    this.logger.debug(
      `Fetching payslips: page ${page}, limit: ${limit}, employeeId: ${employeeId || 'all'}`,
    );
    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const [payslips, total] = await Promise.all([
      this.payslipModel
        .find(query)
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.payslipModel.countDocuments(query).exec(),
    ]);

    const employeeIds = payslips.map((p) => p.employeeId);
    const uploaderIds = payslips.map((p) => p.uploadedBy);
    const allIds = [...new Set([...employeeIds, ...uploaderIds])];

    const employees = await this.userService.getAllEmployees(allIds);

    const data = payslips.map((payslip) => {
      const employee = employees.find(
        (e) => e.employeeId === payslip.employeeId,
      );
      const uploader = employees.find(
        (e) => e.employeeId === payslip.uploadedBy,
      );
      return {
        id: payslip._id.toString(),
        employeeId: payslip.employeeId,
        firstName: employee?.name || 'Unknown',
        month: payslip.month,
        year: payslip.year,
        uploadedAt: (payslip as any).createdOn,
        uploadedBy: uploader?.name || 'Unknown',
        fileName: `Payslip_${payslip.month}_${payslip.year}.pdf`,
      };
    });

    this.logger.log(`Found ${payslips.length} payslips (total: ${total})`);
    return {
      status: 'success',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async allPayslips(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false };

    const [payslips, total] = await Promise.all([
      this.payslipModel
        .find(query)
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.payslipModel.countDocuments(query).exec(),
    ]);

    const employeeIds = payslips.map((p) => p.employeeId);
    const uploaderIds = payslips.map((p) => p.uploadedBy);
    const allIds = [...new Set([...employeeIds, ...uploaderIds])];

    const employees = await this.userService.getAllEmployees(allIds);

    const data = payslips.map((payslip) => {
      const employee = employees.find(
        (e) => e.employeeId === payslip.employeeId,
      );
      const uploader = employees.find(
        (e) => e.employeeId === payslip.uploadedBy,
      );
      return {
        id: payslip._id.toString(),
        employeeId: payslip.employeeId,
        firstName: employee?.name || 'Unknown',
        month: payslip.month,
        year: payslip.year,
        uploadedAt: (payslip as any).createdOn,
        uploadedBy: uploader?.name || 'Unknown',
        fileName: `Payslip_${payslip.month}_${payslip.year}.pdf`,
      };
    });

    return {
      status: 'success',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.payslipModel.findById(id).exec();
  }

  async remove(id: string) {
    this.logger.log(`Removing payslip: ${id}`);
    const payslip = await this.payslipModel.findById(id);
    if (!payslip) {
      this.logger.warn(`Payslip not found for deletion: ${id}`);
      return null;
    }

    try {
      if (fs.existsSync(payslip.location)) {
        fs.unlinkSync(payslip.location);
        this.logger.log(`Deleted payslip file: ${payslip.location}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${payslip.location}`, error);
    }

    const result = await this.payslipModel.findByIdAndDelete(id).exec();
    this.logger.log(`Payslip ${id} removed successfully`);
    return result;
  }

  async download(id: string) {
    const payslip = await this.payslipModel.findById(id);
    return payslip;
  }
}
