// import { CoreDB, KYSELY } from '@/infra/db/db.common';
// import { TransactionService } from '@/infra/global/transaction/transaction.service';
// import {
//   CallHandler,
//   ExecutionContext,
//   Inject,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { lastValueFrom, Observable, of } from 'rxjs';

// @Injectable()
// export class TransactionInterceptor implements NestInterceptor {
//   constructor(
//     @Inject(KYSELY) private db: CoreDB,
//     private reflector: Reflector,
//     private transactionService: TransactionService,
//   ) {}

//   async intercept(
//     context: ExecutionContext,
//     next: CallHandler,
//   ): Promise<Observable<any>> {
//     const useTransaction =
//       this.reflector.getAllAndOverride<boolean>(TRANSACTION_KEY, [
//         context.getHandler(),
//         context.getClass(),
//       ]) || false;

//     if (!useTransaction) {
//       return next.handle(); // Skip if the method is not marked for transactions
//     }

//     return this.db.transaction().execute(async (tx) => {
//       this.transactionService.setTransaction(tx);
//       const res = await lastValueFrom(next.handle());
//       return of(res);
//     });
//   }
// }

// ===== NOTE =====
// Not Used but good for knowledge
// ===== NOTE =====
