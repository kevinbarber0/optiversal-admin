const db = require('.');
const emailer = require('@util/email');

class AccountDB {
  static async getById(accountId, organizationId = null) {
    if (accountId) {
      const { rows } = organizationId
        ? await db.query(
            'SELECT ao.account_id AS "accountId", ao.organization_id AS "organizationId", o.name AS "orgName", o.settings AS "orgSettings", a.email, a.details, ao.roles, CASE WHEN ao.status = 0 THEN 0 ELSE 1 END as "status", ao.date_added AS "dateAdded", a.last_access AS "lastAccess" FROM account_organization ao INNER JOIN account a ON a.account_id = ao.account_id INNER JOIN organization o ON ao.organization_id=o.organization_id WHERE ao.account_id=$1 AND ao.organization_id=$2',
            [accountId, organizationId],
          )
        : await db.query(
            'SELECT ao.account_id AS "accountId", ao.organization_id AS "organizationId", o.name AS "orgName", o.settings AS "orgSettings", a.email, a.details, ao.roles, CASE WHEN ao.status = 0 THEN 0 ELSE 1 END as "status", ao.date_added AS "dateAdded", a.last_access AS "lastAccess" FROM account_organization ao INNER JOIN account a ON a.account_id = ao.account_id INNER JOIN organization o ON a.organization_id=o.organization_id WHERE ao.account_id=$1 AND ao.organization_id=a.organization_id',
            [accountId],
          );
      if (!rows || rows.length !== 1) {
        return null;
      } else {
        return rows[0];
      }
    }
    return null;
  }

  static async getAccountRoles(accountId) {
    if (accountId) {
      const { rows } = await db.query(
        `SELECT ao.organization_id AS "organizationId", ao.roles FROM account_organization ao WHERE ao.account_id=$1`,
        [accountId],
      );

      return rows;
    }
    return null;
  }

  static async getAccountIdByEmail(email) {
    if (email) {
      const values = [email];
      const { rows } = await db.query(
        'SELECT account_id AS "accountId" from account where email=$1',
        values,
      );
      if (!rows || rows.length !== 1) {
        return null;
      } else {
        return rows[0].accountId;
      }
    }
    return null;
  }

  static async getAccountDetailsById(accountId) {
    if (accountId) {
      const values = [accountId];
      const { rows } = await db.query(
        'SELECT a.account_id AS "accountId", a.organization_id AS "organizationId", a.email, a.details, a.roles, a.date_added AS "dateAdded", a.last_access AS "lastAccess" FROM account a WHERE a.account_id=$1',
        values,
      );
      if (!rows || rows.length !== 1) {
        return null;
      } else {
        return rows[0];
      }
    }
    return null;
  }

  static async findOrCreate(id, source, email, user) {
    // console.log('findOrCreate', id, source, email, user);
    let isNew = false;
    let acctId = null;
    let name = null;
    let { rows } = await db.query(
      'SELECT account_id AS "accountId" FROM account WHERE email=$1',
      [email],
    );
    if (rows && rows.length === 1) {
      let orgs = null;
      console.log('found existing account by email');
      acctId = rows[0].accountId;
      name = rows[0]?.details?.name || rows[0]?.details?.displayName;
      if (acctId !== id) {
        //associate updated (SSO) ID, save old one to old_account_id
        await db.query(
          'UPDATE account SET account_id=$2, old_account_id=$1 WHERE account_id=$1',
          [acctId, id],
        );
        orgs = await db.query(
          'UPDATE account_organization SET account_id=$2 WHERE account_id=$1 RETURNING *',
          [acctId, id],
        );
      } else {
        orgs = await db.query(
          'SELECT * FROM account_organization WHERE account_id=$1',
          [acctId],
        );
      }

      if (orgs?.rows?.length > 0) {
        const banOrgs = orgs.rows.filter((org) => org.status === 0);
        if (banOrgs.length > 0) {
          return {
            accountId: acctId,
            email: email,
            isNew: false,
            status: false,
          };
        }
      }
      acctId = id;
    } else if (rows && rows.length > 1) {
      console.log('multiple accounts with email ' + email);
      throw new Error('Invalid account');
    }

    if (!acctId) {
      console.log('creating new account with id ' + id);
      const domain = email.split('@')[1];
      await db.query(
        'INSERT INTO account (account_id, email, details, last_access, organization_id) VALUES ($1, $2, $3, NOW(), (SELECT organization_id FROM organization WHERE allowed_domain=$4 LIMIT 1))',
        [id, email, user, domain],
      );
      await db.query(
        'INSERT INTO account_organization (account_id, organization_id) SELECT $1, organization_id FROM organization WHERE allowed_domain=$2',
        [id, domain],
      );
      isNew = true;
      acctId = id;
      emailer.sendEmail(
        'alerts@optiversal.com',
        'alerts@optiversal.com',
        'New account',
        email,
      );
    } else {
      await db.query(
        'UPDATE account SET last_access=NOW() WHERE account_id=$1',
        [acctId],
      );
    }

    console.log('SUCCESS: ' + acctId + ' / ' + email);
    return { accountId: acctId, email: email, isNew: isNew, status: true };
  }

  static async setemail_verified(accountId) {
    const values = [accountId];
    await db.query(
      'UPDATE account SET date_verified=NOW() WHERE account_id=$1',
      values,
    );
  }

  static async updateOrgSettings(orgId, settings) {
    const values = [orgId, settings];
    await db.query(
      'UPDATE organization SET settings=$2 WHERE organization_id=$1',
      values,
    );
  }

  static async updateById(accountId, orgId, data) {
    if (data?.user?.email) {
      await db.query(
        'UPDATE account SET details=$2, email=$3 WHERE account_id=$1',
        [accountId, data.user, data.user.email],
      );
    } else {
      await db.query('UPDATE account SET details=$2 WHERE account_id=$1', [
        accountId,
        data.user,
      ]);
    }
    await db.query(
      'UPDATE account_organization SET status=$3 WHERE account_id=$1 AND organization_id=$2',
      [accountId, orgId, data.status],
    );
    await db.query(
      'UPDATE account_organization SET roles=$3 WHERE account_id=$1 AND organization_id=$2',
      [accountId, orgId, data.roles],
    );

    await Promise.all(
      data.newOrganizationIds.map(async (newOrgId) => {
        await db.query(
          `INSERT INTO account_organization(account_id, organization_id, roles, date_added) VALUES($1, $2, $3, NOW())`,
          [accountId, newOrgId, data.roles],
        );
      }),
    );
    await Promise.all(
      data.deletedOrganizationIds.map(async (deletedOrgId) => {
        await db.query(
          `DELETE FROM account_organization WHERE account_id=$1 AND organization_id=$2`,
          [accountId, deletedOrgId],
        );
      }),
    );
  }

  static async deleteUser(accountId) {
    await db.query(
      `UPDATE account SET details=details || '{"email": "inactive@optiversal.com", "displayName": "Inactive User"}', email='inactive@optiversal.com' WHERE account_id=$1`,
      [accountId],
    );
    await db.query(
      'UPDATE account_organization SET status=$2 WHERE account_id=$1',
      [accountId, 0],
    );

    await db.query(
      'UPDATE account_action SET account_email=$2 WHERE account_id=$1',
      [accountId, 'inactive@optiversal.com'],
    );
  }

  static async getAllByOrgId(orgId, inactivate = false) {
    if (orgId) {
      const values = [orgId];
      const { rows } = inactivate
        ? await db.query(
            `SELECT ao.account_id AS "accountId", ao.organization_id AS "organizationId", a.email, CASE WHEN a.details::json->'name' IS NULL THEN a.details::json->'displayName' ELSE a.details::json->'name' END as "name", a.details, ao.roles, ao.date_added AS "dateAdded", a.last_access AS "lastAccess", CASE WHEN ao.status = 0 THEN 0 ELSE 1 END as "status", (SELECT JSON_AGG(r) FROM (SELECT o.organization_id as "organizationId", o.name FROM organization o INNER JOIN account_organization ao2 ON o.organization_id = ao2.organization_id WHERE ao2.account_id = a.account_id) r) organizations FROM account_organization ao INNER JOIN account a ON a.account_id = ao.account_id WHERE ao.organization_id=$1`,
            values,
          )
        : await db.query(
            `SELECT ao.account_id AS "accountId", ao.organization_id AS "organizationId", a.email, CASE WHEN a.details::json->'name' IS NULL THEN a.details::json->'displayName' ELSE a.details::json->'name' END as "name", a.details, ao.roles, ao.date_added AS "dateAdded", a.last_access AS "lastAccess", CASE WHEN ao.status = 0 THEN 0 ELSE 1 END as "status", (SELECT JSON_AGG(r) FROM (SELECT o.organization_id as "organizationId", o.name FROM organization o INNER JOIN account_organization ao2 ON o.organization_id = ao2.organization_id WHERE ao2.account_id = a.account_id) r) organizations FROM account_organization ao INNER JOIN account a ON a.account_id = ao.account_id WHERE ao.organization_id=$1 AND (ao.status !=0 or ao.status IS NULL)`,
            values,
          );
      return rows;
    }
    return null;
  }

  static async getPublicAllByOrgId(orgId) {
    if (orgId) {
      const values = [orgId];
      const { rows } = await db.query(
        `SELECT ao.account_id AS "accountId", ao.organization_id AS "organizationId", a.email, a.details::json->'disabled' as "disabled", CASE WHEN a.details::json->'name' IS NULL THEN a.details::json->'displayName' ELSE a.details::json->'name' END as "name", (SELECT JSON_AGG(r) FROM (SELECT o.organization_id as "organizationId", o.name FROM organization o INNER JOIN account_organization ao2 ON o.organization_id = ao2.organization_id WHERE ao2.account_id = a.account_id AND ao2.status != 0) r) organizations FROM account_organization ao INNER JOIN account a ON a.account_id = ao.account_id WHERE ao.organization_id=$1 AND (ao.status !=0 or ao.status IS NULL)`,
        values,
      );
      return rows;
    }
    return null;
  }

  static async createAccount(accountId, details, data) {
    console.log('creating new account with id ' + accountId);
    let values = [
      accountId,
      data.email,
      details,
      data.orgId || null,
      data.roles ? JSON.stringify(data.roles) : null,
    ];
    await db.query(
      'INSERT INTO account (account_id, email, details, last_access, organization_id, roles) VALUES ($1, $2, $3, NOW(), $4, $5)',
      values,
    );

    // Create Account Organization
    const organizationIds = [data.orgId, ...data.organizationIds].filter(
      (v, i, arr) => arr.indexOf(v) === i,
    );

    await Promise.all(
      organizationIds.map(async (orgId) => {
        values = [
          accountId,
          orgId || null,
          data.roles ? JSON.stringify(data.roles) : null,
        ];
        await db.query(
          `INSERT INTO account_organization(account_id, organization_id, roles, date_added) VALUES($1, $2, $3, NOW())`,
          values,
        );
      }),
    );

    values = [accountId];
    const { rows } = await db.query(
      'SELECT a.account_id AS "accountId", a.organization_id AS "organizationId", a.email, a.details, a.roles, a.date_added AS "dateAdded", a.last_access AS "lastAccess" FROM account a WHERE a.account_id=$1',
      values,
    );
    if (rows.length === 1) {
      emailer.sendEmail(
        'alerts@optiversal.com',
        'alerts@optiversal.com',
        'New account',
        rows[0].email,
      );
      return rows[0];
    } else {
      return null;
    }
  }

  static async findOrgProvider(email) {
    console.log('finding identity provider for email ' + email);
    if (process.env.ENABLE_SSO) {
      console.log('SSO enabled');
      let values = [email];
      let { rows } = await db.query(
        'SELECT o.identity_provider FROM organization o INNER JOIN account a ON a.organization_id=o.organization_id WHERE a.email = $1',
        values,
      );
      if (rows.length === 1) {
        return rows[0].identity_provider;
      } else {
        values = [email.split('@')[1]];
        let { rows } = await db.query(
          'SELECT o.identity_provider FROM organization o WHERE o.allowed_domain = $1',
          values,
        );
        if (rows.length === 1) {
          return rows[0].identity_provider;
        } else {
          return null;
        }
      }
    } else {
      console.log('SSO not enabled');
      return null;
    }
  }

  static async getAccountOrganizations(accountId) {
    if (!accountId) return null;

    const values = [accountId];
    const { rows } = await db.query(
      `SELECT ao.organization_id AS "organizationId", o.name, o.settings, ao.roles FROM account_organization ao INNER JOIN organization o ON ao.organization_id = o.organization_id WHERE ao.account_id = $1`,
      values,
    );

    return rows;
  }

  static async getRolesByOrganizationId(accountId, organizationId) {
    const values = [accountId, organizationId];
    const { rows } = await db.query(
      `SELECT ao.roles FROM account_organization ao WHERE account_id=$1 AND organization_id=$2`,
      values,
    );

    if (rows.length === 1) {
      return rows[0].roles;
    }

    return null;
  }
}

module.exports = AccountDB;
