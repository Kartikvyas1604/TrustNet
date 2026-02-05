template TransactionMembership() {
    // Private inputs
    signal input transaction_hash;
    signal input merkle_path[10]; // Assuming depth 10
    signal input merkle_indices[10];
    
    // Public inputs
    signal input merkle_root;
    
    // Output
    signal output valid;
    
    // Merkle tree verification logic
    signal computed_root;
    signal path_elements[11];
    
    path_elements[0] <== transaction_hash;
    
    // Simple merkle path verification (simplified)
    for (var i = 0; i < 10; i++) {
        path_elements[i+1] <== path_elements[i] + merkle_path[i];
    }
    
    computed_root <== path_elements[10];
    
    // Check if computed root matches expected root
    valid <== (computed_root - merkle_root) * (computed_root - merkle_root);
}

component main = TransactionMembership();