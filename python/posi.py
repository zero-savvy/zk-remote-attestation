import poseidon

def pos_instance():
    # poseidon_simple, t = poseidon.parameters.case_simple()

    # input_vec = [x for x in range(0, t)]
    # print("Input: ", input_vec)
    # poseidon_digest = poseidon_simple.run_hash(input_vec)
    # print("Output: ", hex(int(poseidon_digest)))

    # Matched with Circom's Standard implementation parameters. Accoring to https://eprint.iacr.org/2019/458.pdf (table 2, table 8)
    security_level = 128
    input_rate = 2
    t = 3
    full_round = 8
    partial_round = 57
    alpha = 5
    
    # poseidon_pre_generated = poseidon.Poseidon(p=selected_prime,
    #                                            security_level=security_level,
    #                                            alpha=alpha,
    #                                            input_rate=input_rate,
    #                                            t=t,
    #                                            full_round=full_round,
    #                                            partial_round=partial_round
    #                                            )
    poseidon_pre_generated = poseidon.Poseidon(poseidon.prime_254, security_level, alpha, input_rate, t=t, full_round=full_round,
                                 partial_round=partial_round, rc_list=poseidon.round_constants_254, mds_matrix=poseidon.matrix_254)
    
    # poseidon_pre_generated = poseidon.OptimizedPoseidon(poseidon.HashType.CONSTINPUTLEN, selected_prime, 
    #                                                 security_level, alpha, input_rate, t_opt,
    #                                                 full_round=full_round, partial_round=partial_round,
    #                                                 rc_list=poseidon.parameters.round_constants_neptune, 
    #                                                 mds_matrix=poseidon.parameters.matrix_neptune)
    
    return poseidon_pre_generated


if __name__ == "__main__":
    pos_instance()