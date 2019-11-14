const { getEventArgument } = require('@aragon/test-helpers/events')

task('aragon:new_dao', 'Deploys a new Aragon DAO')
  .setAction(async () => {
    // Retrieve contract artifacts.
    const Kernel = artifacts.require('@aragon/core/contracts/kernel/Kernel')
    const ACL = artifacts.require('@aragon/core/contracts/acl/ACL')
    const EVMScriptRegistryFactory = artifacts.require('@aragon/core/contracts/factory/EVMScriptRegistryFactory')
    const DAOFactory = artifacts.require('@aragon/core/contracts/factory/DAOFactory')

    // Address that will own the DAO.
    const accounts = await web3.eth.getAccounts()
    const appManager = accounts[0]
    console.log(`Deploying DAO with account ${appManager}`)

    // Deploy a DAOFactory.
    const kernelBase = await Kernel.new(true)
    const aclBase = await ACL.new()
    const registryFactory = await EVMScriptRegistryFactory.new()
    const daoFactory = await DAOFactory.new(
      kernelBase.address,
      aclBase.address,
      registryFactory.address
    )

    // Create a DAO instance.
    const daoReceipt = await daoFactory.newDAO(appManager)
    const dao = await Kernel.at(getEventArgument(daoReceipt, 'DeployDAO', 'dao'))
    console.log(`Aragon DAO deployed at ${dao.address}`)

    // Grant the appManager address permission to install apps in the DAO.
    const acl = await ACL.at(await dao.acl())
    const APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    await acl.createPermission(
      appManager,
      dao.address,
      APP_MANAGER_ROLE,
      appManager,
      { from: appManager }
    )
  })