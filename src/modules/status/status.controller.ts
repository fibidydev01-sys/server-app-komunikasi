import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { StatusService } from './status.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusPrivacyDto } from './dto/update-status-privacy.dto';
import type { User } from '../../common/interface/user.interface';
import type { Status, StatusView } from '@prisma/client';

interface StatusResponse {
  statusCode: number;
  message: string;
  data?: Status | Status[] | StatusView | StatusView[];
}

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  async createStatus(
    @CurrentUser() user: User,
    @Body() dto: CreateStatusDto,
  ): Promise<StatusResponse> {
    const status = await this.statusService.createStatus(user.id, dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Status created successfully',
      data: status,
    };
  }

  @Get()
  async getContactsStatuses(
    @CurrentUser() user: User,
  ): Promise<StatusResponse> {
    const statuses = await this.statusService.getContactsStatuses(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Statuses retrieved successfully',
      data: statuses,
    };
  }

  @Get('my')
  async getMyStatuses(@CurrentUser() user: User): Promise<StatusResponse> {
    const statuses = await this.statusService.getMyStatuses(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'My statuses retrieved successfully',
      data: statuses,
    };
  }

  @Get(':id')
  async getStatusById(
    @CurrentUser() user: User,
    @Param('id') statusId: string,
  ): Promise<StatusResponse> {
    const status = await this.statusService.getStatusById(statusId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Status retrieved successfully',
      data: status,
    };
  }

  @Post(':id/view')
  async markAsViewed(
    @CurrentUser() user: User,
    @Param('id') statusId: string,
  ): Promise<StatusResponse> {
    const view = await this.statusService.markAsViewed(statusId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Status marked as viewed',
      data: view,
    };
  }

  @Get(':id/views')
  async getStatusViews(
    @CurrentUser() user: User,
    @Param('id') statusId: string,
  ): Promise<StatusResponse> {
    const views = await this.statusService.getStatusViews(statusId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Views retrieved successfully',
      data: views,
    };
  }

  @Patch(':id/privacy')
  async updatePrivacy(
    @CurrentUser() user: User,
    @Param('id') statusId: string,
    @Body() dto: UpdateStatusPrivacyDto,
  ): Promise<StatusResponse> {
    const status = await this.statusService.updatePrivacy(
      statusId,
      user.id,
      dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Status privacy updated successfully',
      data: status,
    };
  }

  @Delete(':id')
  async deleteStatus(
    @CurrentUser() user: User,
    @Param('id') statusId: string,
  ): Promise<StatusResponse> {
    const result = await this.statusService.deleteStatus(statusId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
