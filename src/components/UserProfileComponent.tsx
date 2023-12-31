import React, { useState, useEffect, useRef, useContext } from 'react';
import { Form, Button, InputGroup, FormControl, Card } from 'react-bootstrap';
import db from '../utils/Db'; // Adjust the import path to your Dexie database
import { UserProfile } from '../models/UserProfile'; // Adjust the import path to your Profile model
import { SettingContext } from '../contexts/SettingContext';

const UserProfileComponent: React.FC = () => {
    // State for profile fields
    const [name, setName] = useState<string>('');
    const [photo, setPhoto] = useState<string>('assets/placeholder/char.png'); // Set to default image path
    const [characterDescription, setCharacterDescription] = useState<string>('');
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { settings, updateSetting } = useContext(SettingContext);

    // Load profiles from IndexedDB on mount
    useEffect(() => {
        const loadProfiles = async () => {
            const allProfiles = await db.profiles.toArray();
            setProfiles(allProfiles);
        };
        loadProfiles();
    }, []);

    // Convert file to Base64 for photo
    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => resolve(fileReader.result as string);
            fileReader.onerror = (error) => reject(error);
        });
    };

    // Trigger the hidden file input when the image is clicked
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const base64 = await convertToBase64(file);
            setPhoto(base64);
        }
    };

    // Handle profile saving (add or update)
    const handleSaveProfile = async () => {
        try {
            await db.profiles.put({ name, photo, characterDescription });
            // Reload the profiles from the database
            setProfiles(await db.profiles.toArray());
        } catch (error) {
            console.error("Failed to save the profile", error);
        }
    };

    // Function to handle profile selection for editing
    const handleProfileSelection = (profile: UserProfile) => {
        setName(profile.name);
        setPhoto(profile.photo);
        setCharacterDescription(profile.characterDescription);
        setEditingProfileId(profile.name);
    };

    const handleDeleteProfile = async () => {
        if (editingProfileId) {
            await db.profiles.delete(editingProfileId);
            setProfiles(await db.profiles.toArray()); // Update profiles list
            // Reset form or close edit mode
            clearForm();
        }
    };

    // Function to clear form (used in create mode)
    const clearForm = () => {
        setName('');
        setPhoto('assets/placeholder/char.png');
        setCharacterDescription('');
        setEditingProfileId(null);
    };

    const handleSetActiveCharacter = async () => {
        // Implementation depends on how you're tracking the active character
        updateSetting('userProfile', 'activeCharacter', profiles.find(p => p.name === editingProfileId));
        clearForm();
    };

    return (
        <div>
            {/* Section for displaying profile cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '100px' }}>
                {profiles.map((profile, index) => (
                    <Card key={index} style={{ width: 'calc(14.28% - 10px)', 
                    border: settings.userProfile.activeCharacter.name === profile.name ? '5px solid #55aa55' : 'none' }} 
                    onClick={() => handleProfileSelection(profile)}>
                        <Card.Img variant="top" src={profile.photo} style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }} />
                        <Card.Body>
                            <Card.Title>{profile.name}</Card.Title>
                            <Card.Text>
                                {profile.characterDescription}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            <Form>

                {/* Image placeholder for photo upload */}
                <div onClick={handleImageClick} style={{ cursor: 'pointer' }}>
                    <img src={photo} alt="Profile" style={{ maxHeight: '200px', maxWidth: '200px' }} />
                    <input type='file' ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
                </div>

                <div className="d-flex justify-content-center">
                    <Card style={{ width: '70%' }}>
                        <Card.Body>
                            <Form.Group controlId="formProfileName">
                                <Form.Label>Name</Form.Label>
                                <Form.Control type="text" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} />
                            </Form.Group>

                            <Form.Group controlId="formProfileCharacterDescription">
                                <Form.Label>Character Description</Form.Label>
                                <Form.Control as="textarea" rows={3} placeholder="Character Description" value={characterDescription} onChange={(e) => setCharacterDescription(e.target.value)} />
                            </Form.Group>

                            {/* Buttons */}
                            <div>
                                <Button variant="primary" className="me-2" onClick={handleSaveProfile}>
                                    Save Profile
                                </Button>

                                {/* Conditionally render Delete and Set as Active buttons if in edit mode */}
                                {editingProfileId && (
                                    <>
                                        <Button variant="danger" className="me-2" onClick={handleDeleteProfile}>
                                            Delete
                                        </Button>
                                        <Button variant="info" className="me-2" onClick={handleSetActiveCharacter}>
                                            Set as Active Character
                                        </Button>
                                    </>
                                )}

                                {/* Conditionally render Clear button if in create mode */}
                                {!editingProfileId && (
                                    <Button variant="secondary" onClick={clearForm}>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </Form>
        </div>
    );
};

export default UserProfileComponent;
