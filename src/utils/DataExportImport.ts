import * as pako from 'pako';
import db from './Db';

export class DataExportImport {
    // Compresses and encodes the data object to a string
    exportData(dataObject: any): string {
        // Convert JSON object to string
        const jsonString = JSON.stringify(dataObject).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Convert string to Uint8Array
        const charData = jsonString.split('').map((x) => x.charCodeAt(0));
        const binaryData = new Uint8Array(charData);

        // Compress data
        const compressed = pako.deflate(binaryData);

        // Convert Uint8Array to a binary string
        let binaryString = "";
        for (let i = 0; i < compressed.length; i++) {
            binaryString += String.fromCharCode(compressed[i]);
        }
        // Convert binary string to Base64
        const compressedBase64 = btoa(binaryString);

        return compressedBase64;
    }

    // Decompresses and decodes the data string back to object
    importData(data: string): any {
        // Decode Base64 string to a binary string
        const binaryString = atob(data);

        // Convert binary string to a Uint8Array
        const charList = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            charList[i] = binaryString.charCodeAt(i);
        }

        // Use Pako to decompress
        const decompressed = pako.inflate(charList, { to: 'string' });

        // Convert string back to JSON object and return
        return JSON.parse(decompressed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''));
    }

    // Placeholder for UI logic to handle import click
    async onImportClick(dataType: string) {
        // Create an input element of type 'file'
        const inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.style.display = 'none'; // Hide the input element

        // Set up the event listener for when a file is selected
        inputElement.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                // Read the file
                const reader = new FileReader();

                // Define what happens on file read
                reader.onload = async (e) => {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        // Use the importData function on the read content
                        const decompressedData = this.importData(text);

                        // Handle the decompressed data (e.g., console log or update state)
                        if (dataType === 'settings') {
                            if(decompressedData?.settings) {
                                localStorage.setItem('settings', JSON.stringify(decompressedData));
                                window.location.reload();
                            } else {
                                console.error('No settings found in file');
                            }
                        } else if(dataType === 'chat') { 
                            if(decompressedData?.scenes && decompressedData?.chat) {
                                await db.scenes.clear();
                                await db.messages.clear();
                                await db.scenes.bulkAdd(decompressedData.scenes);
                                await db.messages.bulkAdd(decompressedData.chat);
                                window.location.reload();
                            } else {
                                console.error('Invalid chat data found in file');
                            }
                            
                        } else if(dataType === 'character') {
                            if(decompressedData?.length) {
                                for (const character of decompressedData) {
                                    await db.characters.put(character);
                                }
                                window.location.reload();
                            } else {
                                console.error('Invalid character data found in file');
                            }
                        } else {
                            console.log(decompressedData);
                        }
                    }
                };
                // Remove the input element after use
                document.body.removeChild(inputElement);
                // Read the file as a text
                reader.readAsText(file);
            }
        };

        document.body.appendChild(inputElement);

        // Click the input to open the file dialog
        inputElement.click();

        // Clean up: Remove the input element if the user cancels the file selection
        // This is a fallback in case the onchange event doesn't trigger
        inputElement.addEventListener('click', function handleOutsideClick() {
            if (!inputElement.value) {
                document.body.removeChild(inputElement);
            }
            // Remove this event listener once the click is handled
            inputElement.removeEventListener('click', handleOutsideClick);
        });
    }

    // Placeholder for UI logic to handle export click
    async onExportClick(dataType: string) {
        // Retrieve the data from localStorage
        let data: any = null;
        let filename = 'eunoistora-';
        if (dataType === 'settings') {
            data = localStorage.getItem('settings');
            if (data) {
                data = JSON.parse(data);
            }
            filename += 'settings.eis';
        } else if (dataType === 'chat') {
            data ={
                scenes:  await db.scenes.toArray(),
                chat:  await db.messages.toArray()
            };
            filename += 'chat.eis';
        } else if (dataType === 'character') {
            data = await db.characters.toArray();
            filename += 'characters.eis';
        }
        if (data) {
            // Use the exportData function to compress and encode the data
            const compressedData = this.exportData(data);

            // Create a blob from the compressed data
            const blob = new Blob([compressedData], { type: 'text/plain' });

            // Create a link element
            const link = document.createElement('a');

            // Set the href to the blob and define download filename
            link.href = URL.createObjectURL(blob);
            link.download = filename; // or 'exampleFile.json' or whatever file type you want

            // Append the link to the body, click it, and then remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('No data found in localStorage with key "exampleKey"');
        }
    }

    async onClearClick(dataType: string) {
        if (dataType === 'settings') {
            localStorage.setItem('settings', '{}');
            window.location.reload();
        } else if (dataType === 'chat') {
            await db.scenes.clear();
            await db.messages.clear();
            window.location.reload();
        } else if (dataType === 'character') {
            await db.characters.clear();
            window.location.reload();
        }
    }
}

const dataExportImport = new DataExportImport();

export default dataExportImport;
