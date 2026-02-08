package wbos.backend.service.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Service for encrypting and decrypting database passwords
 * Uses AES encryption to store passwords securely
 */
@Service
@Slf4j
public class PasswordEncryptionService {

    private static final String ALGORITHM = "AES";
    private final SecretKeySpec secretKey;

    public PasswordEncryptionService(
            @Value("${security.encryption.key:MySecretEncryptionKey123456}") String encryptionKey) {
        // Ensure key is exactly 16, 24, or 32 bytes for AES
        String paddedKey = String.format("%-32s", encryptionKey).substring(0, 32);
        this.secretKey = new SecretKeySpec(paddedKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
    }

    /**
     * Encrypts a plain text password
     *
     * @param plainPassword The password in plain text
     * @return Base64 encoded encrypted password
     */
    public String encrypt(String plainPassword) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(plainPassword.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("Failed to encrypt password", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypts an encrypted password
     *
     * @param encryptedPassword The Base64 encoded encrypted password
     * @return Plain text password
     */
    public String decrypt(String encryptedPassword) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decoded = Base64.getDecoder().decode(encryptedPassword);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt password", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
