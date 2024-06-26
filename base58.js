// Use strict
"use strict";


// Classes

// Base58 class
class Base58 {

	// Public
		
		// Encode
		static encode(byteArray) {
		
			// Go through all leading zeros in the byte array
			var numberOfLeadingZeros = 0;
			while(numberOfLeadingZeros < byteArray["length"] && byteArray[numberOfLeadingZeros] === 0) {
			
				// Increment number of leading zeros
				++numberOfLeadingZeros;
			}
			
			// Get buffer size
			var bufferSize = Math.ceil((byteArray["length"] - numberOfLeadingZeros) * Base58.BYTES_PER_LENGTH_IN_NEW_BASE);
			
			// Create buffer
			var buffer = (new Uint8Array(bufferSize)).fill(0);
			
			// Go through all bytes in the byte array after the leading zeros
			var length = 0;
			for(var i = numberOfLeadingZeros; i < byteArray["length"]; ++i) {
			
				// Get byte
				var byte = byteArray[i];
				
				// Go through all base 58 components of the byte
				for(var j = 0, k = bufferSize - 1; (byte !== 0 || j < length) && k >= 0; ++j, --k) {
				
					// Include the current buffer value in the byte
					byte += (Base58.BYTE_MAX_VALUE + 1) * buffer[k];
					
					// Set value in the buffer
					buffer[k] = byte % Base58.NUMBER_BASE;
					
					// Update the byte
					byte = Math.floor(byte / Base58.NUMBER_BASE);
				}
				
				// Update length
				length = j;
			}
			
			// Go through all leading zeros in the buffer
			var bufferIndex = bufferSize - length;
			while(bufferIndex < buffer["length"] && buffer[bufferIndex] === 0) {
			
				// Increment buffer index
				++bufferIndex;
			}
			
			// Set result to start with the number of leading zeros in base58
			var result = Base58.CHARACTERS[0].repeat(numberOfLeadingZeros);
			
			// Go through all bytes in the buffer after the leading zeros
			for(; bufferIndex < buffer["length"]; ++bufferIndex) {
			
				// Append buffer's value in base58 to the result
				result += Base58.CHARACTERS[buffer[bufferIndex]];
			}
			
			// Return result
			return result;
		}
		
		// Encode with checksum
		static encodeWithChecksum(byteArray) {
		
			// Get the checksum of the byte array
			var checksum = Base58.getChecksum(byteArray);
			
			// Return encoding the byte array with the checksum
			return Base58.encode(Base58.mergeArrays([
					
				// Byte array
				byteArray,
				
				// Checksum
				checksum
			]));
		}
		
		// Decode
		static decode(base58String) {
		
			// Go through all leading zeros in base58 in the string
			var numberOfLeadingZeros = 0;
			while(numberOfLeadingZeros < base58String["length"] && base58String[numberOfLeadingZeros] === Base58.CHARACTERS[0]) {
			
				// Increment number of leading zeros
				++numberOfLeadingZeros;
			}
			
			// Get buffer size
			var bufferSize = Math.ceil((base58String["length"] - numberOfLeadingZeros) * Base58.BYTES_PER_LENGTH_IN_OLD_BASE);
			
			// Crete buffer
			var buffer = (new Uint8Array(bufferSize)).fill(0);
			
			// Go through all characters in the string after the leading zeros in base58
			var length = 0;
			for(var i = numberOfLeadingZeros; i < base58String["length"]; ++i) {
			
				// Get character as byte
				var byte = Base58.CHARACTERS.indexOf(base58String[i]);
				
				// Check if byte is invalid
				if(byte === Base58.INDEX_NOT_FOUND) {
				
					// Throw error
					throw "Invalid base58 string.";
				}
				
				// Go through all base 58 components of the byte
				for(var j = 0, k = bufferSize - 1; (byte !== 0 || j < length) && k >= 0; ++j, --k) {
				
					// Include the current buffer value in the byte
					byte += Base58.NUMBER_BASE * buffer[k];
					
					// Set value in the buffer
					buffer[k] = byte % (Base58.BYTE_MAX_VALUE + 1);
					
					// Update the byte
					byte = Math.floor(byte / (Base58.BYTE_MAX_VALUE + 1));
				}
				
				// Update length
				length = j;
			}
			
			// Go through all leading zeros in the buffer
			var bufferIndex = bufferSize - length;
			while(bufferIndex < buffer["length"] && buffer[bufferIndex] === 0) {
			
				// Increment buffer index
				++bufferIndex;
			}
			
			// Set result to start with the number of leading zeros
			var result = (new Uint8Array(numberOfLeadingZeros + bufferSize - bufferIndex)).fill(0);
			
			// Go through all bytes in the buffer after the leading zeros
			for(var i = 0; bufferIndex < buffer["length"]; ++i, ++bufferIndex) {
			
				// Append buffer's value to the result
				result[i + numberOfLeadingZeros] += buffer[bufferIndex];
			}
			
			// Return result
			return result;
		}
		
		// Decode with checksum
		static decodeWithChecksum(base58String) {
		
			// Try
			try {
		
				// Decode the string
				var byteArray = Base58.decode(base58String);
			}
			
			// Catch errors
			catch(error) {
			
				// Throw error
				throw error;
			}
			
			// Check if the byte array doesn't include a checksum
			if(byteArray["length"] < Base58.CHECKSUM_LENGTH) {
			
				// Throw error
				throw "No checksum exists.";
			}
			
			// Otherwise
			else {
			
				// Get the checksum of the byte array without its checksum
				var checksum = Base58.getChecksum(byteArray.subarray(0, byteArray["length"] - Base58.CHECKSUM_LENGTH));
				
				// Get the provided checksum from the byte array
				var providedChecksum = byteArray.subarray(byteArray["length"] - Base58.CHECKSUM_LENGTH);
				
				// Check if checksums don't match
				if(Base58.arraysAreEqual(checksum, providedChecksum) === false) {
				
					// Throw error
					throw "Invalid checksum.";
				}
				
				// Otherwise
				else {
				
					// Return byte array without the checksum
					return byteArray.subarray(0, byteArray["length"] - Base58.CHECKSUM_LENGTH);
				}
			}
		}
	
	// Private
	
		// Get checksum
		static getChecksum(byteArray) {
		
			// Get a hash of the hash of the byte array
			var hash = new Uint8Array(sha256.arrayBuffer(new Uint8Array(sha256.arrayBuffer(byteArray))));
			
			// Get the checksum from the hash
			var checksum = hash.subarray(0, Base58.CHECKSUM_LENGTH);
			
			// Return checksum
			return checksum;
		}
		
		// Merge arrays
		static mergeArrays(arrays) {
		
			// Initialize result
			var result = new Uint8Array([]);
		
			// Go through all arrays
			for(var i = 0; i < arrays["length"]; ++i) {
			
				// Get array
				var array = arrays[i];
				
				// Set updated result to be the length of the current result and the array
				var updatedResult = new Uint8Array(result["length"] + array["length"]);
				
				// Set arrays in the updated result
				updatedResult.set(result);
				updatedResult.set(array, result["length"]);
				
				// Set result to the updated result
				result = updatedResult;
			}
		
			// Return result
			return result;
		}
		
		// Arrays are equal
		static arraysAreEqual(arrayOne, arrayTwo) {
		
			// Check if arrays have different lengths
			if(arrayOne["length"] !== arrayTwo["length"])
			
				// Return false
				return false;
			
			// Go through all values each array
			for(var i = 0; i < arrayOne["length"]; ++i)
			
				// Check if array values differ
				if(arrayOne[i] !== arrayTwo[i])
				
					// Return false
					return false;
			
			// Return true
			return true;
		}
		
		// Characters
		static get CHARACTERS() {
		
			// Return characters
			return "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
		}
		
		// Number base
		static get NUMBER_BASE() {
		
			// Return number base
			return 58;
		}
		
		// Bytes per length in new base
		static get BYTES_PER_LENGTH_IN_NEW_BASE() {
		
			// Return bytes per length in new base
			return Math.log(Base58.BYTE_MAX_VALUE + 1) / Math.log(Base58.NUMBER_BASE);
		}
		
		// Bytes per length in old base
		static get BYTES_PER_LENGTH_IN_OLD_BASE() {
		
			// Return bytes per length in old base
			return Math.log(Base58.NUMBER_BASE) / Math.log(Base58.BYTE_MAX_VALUE + 1);
		}
		
		// Checksum length
		static get CHECKSUM_LENGTH() {
		
			// Return checksum length
			return 4;
		}
		
		// Bits in a byte
		static get BITS_IN_A_BYTE() {
		
			// Return bits in a byte
			return 8;
		}
		
		// Byte max value
		static get BYTE_MAX_VALUE() {
		
			// Return byte max value
			return Math.pow(2, Base58.BITS_IN_A_BYTE) - 1;
		}
		
		// Index not found
		static get INDEX_NOT_FOUND() {
		
			// Return index not found
			return -1;
		}
}


// Main function

// Set global object's base58
globalThis["Base58"] = Base58;
