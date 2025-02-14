use near_sdk::{near, near_bindgen, AccountId, Promise, env, PanicOnDefault};
use near_sdk::collections::UnorderedSet;
use near_gas::NearGas;

const GAS_FOR_REQUEST_SIGNATURE: NearGas = NearGas::from_tgas(10);
const TESTNET_SIGNER: &str = "v1.signer-dev.testnet";
//const MAINNET_SIGNER: &str = "v1.signer.near";

#[near_bindgen]
#[derive(PanicOnDefault)]
pub struct ProxyContract {
    owner_id: AccountId,
    authorized_users: UnorderedSet<AccountId>,
    signer_contract: AccountId,
}

use near_sdk::borsh::{self, BorshSerialize};

 #[derive(BorshSerialize, PanicOnDefault)]
pub struct SignRequest {
    pub payload: [u8; 32],
    pub path: String,
    pub key_version: u32,
}

//pub struct SignatureResponse {
//    pub big_r: SerializableAffinePoint,
//    pub s: SerializableScalar,
//    pub recovery_id: u8,
//}

#[near]
impl ProxyContract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        assert!(!env::state_exists(), "Contract is already initialized");
        Self {
            owner_id,
            authorized_users: UnorderedSet::new(b"a"),
            signer_contract: TESTNET_SIGNER.parse().unwrap(),
        }
    }

    pub fn set_signer_contract(&mut self, new_signer: AccountId) {
        self.assert_owner();
        self.signer_contract = new_signer;
    }

    pub fn get_signer_contract(&self) -> AccountId {
        self.signer_contract.clone()
    }

    #[payable]
    pub fn request_signature(&mut self, path: String, key_version: u32, payload: [u8; 32]) -> Promise {
        assert!(
            env::prepaid_gas() >= GAS_FOR_REQUEST_SIGNATURE,
            "Not enough gas attached. Please attach 10 TGas"
        );
        assert!(
            self.authorized_users.contains(&env::predecessor_account_id()),
            "Unauthorized: only authorized users can request signatures"
        );
        let request = SignRequest {
            payload: payload,
            path: path.into(),
            key_version: key_version,
        };
        let mut request_bytes = Vec::new();
        request.serialize(&mut request_bytes).unwrap();
        Promise::new(self.signer_contract.clone()).function_call(
            "sign".to_string(),
            request_bytes,
            env::attached_deposit(),
            GAS_FOR_REQUEST_SIGNATURE
        )
    }

    // Owner methods for managing authorized users
    pub fn add_authorized_user(&mut self, account_id: AccountId) {
        self.assert_owner();
        self.authorized_users.insert(&account_id);
    }

    pub fn remove_authorized_user(&mut self, account_id: AccountId) {
        self.assert_owner();
        self.authorized_users.remove(&account_id);
    }

    pub fn get_authorized_users(&self) -> Vec<AccountId> {
        self.authorized_users.to_vec()
    }

    // View methods
    pub fn is_authorized(&self, account_id: AccountId) -> bool {
        self.authorized_users.contains(&account_id)
    }

    // Helper methods
    fn assert_owner(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Be gone. You have no power here."
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::{test_utils::{accounts, VMContextBuilder}, testing_env};

    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

    #[test]
    fn test_new() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let contract = ProxyContract::new(accounts(1));
        assert_eq!(contract.owner_id, accounts(1));
    }

    #[test]
    fn test_authorize_user() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));

        contract.add_authorized_user(accounts(2));
        assert!(contract.is_authorized(accounts(2)));
    }

    #[test]
    fn test_remove_authorized_user() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));

        contract.add_authorized_user(accounts(2));
        assert!(contract.is_authorized(accounts(2)));

        contract.remove_authorized_user(accounts(2));
        assert!(!contract.is_authorized(accounts(2)));
    }

    #[test]
    #[should_panic(expected = "Be gone. You have no power here.")]
    fn test_unauthorized_add_user() {
        let context = get_context(accounts(2));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));
        contract.add_authorized_user(accounts(3));
    }

    #[test]
    fn test_get_authorized_users() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));

        contract.add_authorized_user(accounts(2));
        contract.add_authorized_user(accounts(3));

        let users = contract.get_authorized_users();
        assert_eq!(users.len(), 2);
        assert!(users.contains(&accounts(2)));
        assert!(users.contains(&accounts(3)));
    }

    #[test]
    fn test_set_signer_contract() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));

        contract.set_signer_contract(accounts(2));
        assert_eq!(contract.get_signer_contract(), accounts(2));
    }

    #[test]
    #[should_panic(expected = "Be gone. You have no power here.")]
    fn test_unauthorized_set_signer() {
        let context = get_context(accounts(2));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));
        contract.set_signer_contract(accounts(3));
    }

    #[test]
    #[should_panic(expected = "Unauthorized: only authorized users can request signatures")]
    fn test_unauthorized_request_signature() {
        let context = get_context(accounts(2));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));
        contract.request_signature("near-1".to_string(), 1, [0u8; 32]);
    }

    #[test]
    fn test_authorized_request_signature() { //TODO rewrite this as a workspace integration test
        let context = get_context(accounts(2));
        testing_env!(context.build());
        let mut contract = ProxyContract::new(accounts(1));

        testing_env!(get_context(accounts(1)).build());
        contract.add_authorized_user(accounts(2));

        testing_env!(get_context(accounts(2)).build());
        contract.request_signature("near-1".to_string(), 1, [0u8; 32]);
    }
}
