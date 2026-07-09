import { Command, CommandRunner } from 'nest-commander';

import { AccountService } from '@/domain/base/account/account.service';
import { newAccount } from '@/domain/base/account/account.util';
import { mockUser } from '@/domain/base/user/user.factory';
import { UserService } from '@/domain/base/user/user.service';
import { newUser } from '@/domain/base/user/user.util';
import { TransactionService } from '@/infra/db/transaction/transaction.service';
import { SUPER_ADMIN_ID } from '@/shared/common/common.constant';

@Command({
  name: 'initials:seed',
  description: 'Create record in initials table',
})
export class InitialsCliSeed extends CommandRunner {
  constructor(
    private transactionService: TransactionService,

    private userService: UserService,
    private accountService: AccountService,
  ) {
    super();
  }

  async run(_passedParams: string[]): Promise<void> {
    try {
      await this.transactionService.transaction(async () => this._initAll());
      console.log('==================================');
      console.log('seeding complete...');
      console.log('==================================');
    } catch (error) {
      console.log('==================================');
      console.log(error);
      console.log('==================================');
    }
  }

  private async _initAll(): Promise<void> {
    const superAdminAccount = newAccount({
      username: 'superadmin@example.com',
      password: 'password',
    });

    const superAdmin = mockUser({
      id: SUPER_ADMIN_ID,
      email: 'superadmin@example.com',
      firstName: 'superadmin',
      lastName: 'superadmin',
      accountId: superAdminAccount.id,
    });

    const generalAccount = newAccount({
      username: 'general@example.com',
      password: 'password',
    });

    const general = newUser({
      email: 'general@example.com',
      firstName: 'general',
      lastName: 'general',
      accountId: generalAccount.id,
    });

    await this.accountService.saveBulk([superAdminAccount, generalAccount]);
    await this.userService.saveBulk([superAdmin, general]);
  }
}
