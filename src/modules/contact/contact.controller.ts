import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BlockContactDto } from './dto/block-contact.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import type { User, Contact } from '@prisma/client';

interface ContactResponse {
  statusCode: number;
  message: string;
  data?: Contact | Contact[];
}

@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async getContacts(@CurrentUser() user: User): Promise<ContactResponse> {
    const contacts = await this.contactService.getContacts(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Contacts retrieved successfully',
      data: contacts,
    };
  }

  @Get('blocked')
  async getBlockedContacts(
    @CurrentUser() user: User,
  ): Promise<ContactResponse> {
    const contacts = await this.contactService.getBlockedContacts(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Blocked contacts retrieved successfully',
      data: contacts,
    };
  }

  @Post('block')
  async blockContact(
    @CurrentUser() user: User,
    @Body() dto: BlockContactDto,
  ): Promise<ContactResponse> {
    const result = await this.contactService.blockContact(
      user.id,
      dto.contactId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Post('unblock')
  async unblockContact(
    @CurrentUser() user: User,
    @Body() dto: BlockContactDto,
  ): Promise<ContactResponse> {
    const result = await this.contactService.unblockContact(
      user.id,
      dto.contactId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Delete(':contactId')
  async removeContact(
    @CurrentUser() user: User,
    @Param('contactId') contactId: string,
  ): Promise<ContactResponse> {
    const result = await this.contactService.removeContact(user.id, contactId);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('nickname')
  async updateNickname(
    @CurrentUser() user: User,
    @Body() dto: UpdateNicknameDto,
  ): Promise<ContactResponse> {
    const contact = await this.contactService.updateNickname(
      user.id,
      dto.contactId,
      dto.nickname || null,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Nickname updated successfully',
      data: contact,
    };
  }
}
