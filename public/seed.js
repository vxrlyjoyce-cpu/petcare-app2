function getRelativeDateISO(daysOffset, timeStr = '08:30') {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return timeStr ? `${yyyy}-${mm}-${dd}T${timeStr}` : `${yyyy}-${mm}-${dd}`;
}

export function getDefaultData() {
    return {
        selectedPetId: 'pet-1',
        currentFilter: 'all',
        pets: [
            {
                id: 'pet-1',
                name: 'Barnaby',
                type: 'dog',
                breed: 'Golden Retriever',
                birthdate: getRelativeDateISO(-1120, null),
                weight: 28.5,
                photo: '',
                notes: 'Loves squeaky tennis balls; allergic to chicken.'
            },
            {
                id: 'pet-2',
                name: 'Mochi',
                type: 'cat',
                breed: 'Scottish Fold',
                birthdate: getRelativeDateISO(-740, null),
                weight: 4.3,
                photo: '',
                notes: 'Indoor cat; enjoys salmon treats & sunny windowsills.'
            }
        ],
        logs: [
            {
                id: 'log-1',
                petId: 'pet-1',
                type: 'feeding',
                title: 'Morning Salmon & Rice Kibble',
                detail: '1.5 cups + fish oil',
                datetime: getRelativeDateISO(0, '07:45'),
                mood: 'Happy 😊',
                notes: 'Finished bowl in 2 minutes flat.'
            },
            {
                id: 'log-2',
                petId: 'pet-1',
                type: 'walk',
                title: 'Pine Ridge Trail Walk',
                detail: '45 mins (3.2 km)',
                datetime: getRelativeDateISO(0, '09:15'),
                mood: 'Playful ⚡',
                notes: 'Great recall at the park, played fetch.'
            },
            {
                id: 'log-w4',
                petId: 'pet-1',
                type: 'weight',
                title: 'Weight Check-In',
                detail: '28.5 kg',
                numericValue: 28.5,
                datetime: getRelativeDateISO(0, '10:00'),
                mood: 'Happy 😊',
                notes: 'Steady healthy weight.'
            },
            {
                id: 'log-3',
                petId: 'pet-1',
                type: 'meds',
                title: 'Heartgard Plus Chewable',
                detail: '1 tablet (Monthly)',
                datetime: getRelativeDateISO(-1, '08:00'),
                mood: 'Happy 😊',
                notes: 'Taken easily with morning meal.'
            },
            {
                id: 'log-w3',
                petId: 'pet-1',
                type: 'weight',
                title: 'Weight Check-In',
                detail: '28.2 kg',
                numericValue: 28.2,
                datetime: getRelativeDateISO(-30, '09:00'),
                mood: 'Happy 😊',
                notes: ''
            },
            {
                id: 'log-w2',
                petId: 'pet-1',
                type: 'weight',
                title: 'Weight Check-In',
                detail: '27.8 kg',
                numericValue: 27.8,
                datetime: getRelativeDateISO(-60, '09:00'),
                mood: 'Happy 😊',
                notes: ''
            },
            {
                id: 'log-5',
                petId: 'pet-2',
                type: 'feeding',
                title: 'Tuna & Pumpkin Wet Food',
                detail: '1 can (85g)',
                datetime: getRelativeDateISO(0, '08:00'),
                mood: 'Happy 😊',
                notes: 'Drank plenty of water from fountain.'
            },
            {
                id: 'log-w5',
                petId: 'pet-2',
                type: 'weight',
                title: 'Weight Check-In',
                detail: '4.3 kg',
                numericValue: 4.3,
                datetime: getRelativeDateISO(0, '08:30'),
                mood: 'Sleepy 😴',
                notes: ''
            },
            {
                id: 'log-w6',
                petId: 'pet-2',
                type: 'weight',
                title: 'Weight Check-In',
                detail: '4.1 kg',
                numericValue: 4.1,
                datetime: getRelativeDateISO(-45, '08:30'),
                mood: 'Happy 😊',
                notes: ''
            }
        ],
        reminders: [
            {
                id: 'rem-1',
                petId: 'pet-1',
                title: 'Annual Wellness & DHPP Booster',
                category: 'Vaccination',
                date: getRelativeDateISO(5, null),
                notes: 'Cordillera Pet Clinic — Dr. Reyes',
                completed: false
            },
            {
                id: 'rem-2',
                petId: 'pet-1',
                title: 'Full Deshedding & Bath Spa',
                category: 'Grooming',
                date: getRelativeDateISO(14, null),
                notes: 'Paws & Suds Groomers',
                completed: false
            },
            {
                id: 'rem-3',
                petId: 'pet-2',
                title: 'Flea & Tick Topical Application',
                category: 'Medication',
                date: getRelativeDateISO(3, null),
                notes: 'Apply between shoulder blades after dinner',
                completed: false
            }
        ]
    };
}

