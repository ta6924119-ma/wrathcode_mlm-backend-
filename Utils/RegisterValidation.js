export const isValidEmail = (email)=>{
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email)
}

export const isValidPassword = (password) => {
    const passwordRegex = /^[a-zA-Z0-9._%+-]+[!@#$%^&*+-]\.[a-zA-Z]{3}$/;
    return passwordRegex.test(password);
};


export const isValidPhone= (phoneNumber) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phoneNumber);
}

 export const isValidAdharNumber = (AdAadhaar) => {
    const adharRegex = /^\d{12}$/;
    return adharRegex.test(AdAadhaar);
}

export const isValidPanNumber = (PAN) => {
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
    return panRegex.test(PAN);
}

export const isValidPassportNumber = (Passport) => {
    const passportRegex = /^[A-Z]{1}\d{7}$/;
    return passportRegex.test(Passport);
}

export const isValidVoterId = (VoterId) => {
    const voterIdRegex = /^[A-Z]{3}\d{7}$/;
    return voterIdRegex.test(VoterId);
}

export const isDraiverylicenceId =(Drivery_Licenc) =>{
    const drivery_LicencRegex = /^\d{15}$/;
    return drivery_LicencRegex.test(Drivery_Licenc)
}